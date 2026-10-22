"""Reference contracts captured by scripts/reference_semantics.mjs.

These pure-Python and SQL-construction checks do not replace the separate
SQL Server roundtrip suite. The committed fixture is synthetic source output.
"""

import json
import math
from pathlib import Path

import pytest
from sqlalchemy import Unicode, column, select
from sqlalchemy.dialects import mssql

from cemaris.db.semantics import (
    burial_site_name_predicates,
    contains_name_predicates,
    contract_time_predicates,
    date_parts_to_integer,
    empty_string_to_none,
    js_number,
    name_search_tokens,
    null_to_empty_string,
    partial_date_integer_to_day,
    partial_date_integer_to_month,
    partial_date_integer_to_string,
    partial_date_integer_to_year,
    sanitize_limit,
    sanitize_offset,
)


REFERENCE = json.loads((Path(__file__).parent / "fixtures/semantics-reference.json").read_text(encoding="utf-8"))


def _decode(value):
    if isinstance(value, dict) and "$number" in value:
        return float(value["$number"])
    return value


def _assert_number(actual, expected):
    expected = _decode(expected)
    if isinstance(expected, float) and math.isnan(expected):
        assert math.isnan(actual)
    else:
        assert actual == expected


@pytest.mark.parametrize("case", REFERENCE["numeric"])
def test_form_number_limit_offset_match_executed_reference(case):
    _assert_number(js_number(case["input"]), case["number"])
    _assert_number(sanitize_limit(case["input"]), case["limit"])
    _assert_number(sanitize_offset(case["input"]), case["offset"])


@pytest.mark.parametrize("case", REFERENCE["dateParts"])
def test_partial_date_input_matches_executed_reference(case):
    _assert_number(date_parts_to_integer(*case["parts"]), case["integer"])


@pytest.mark.parametrize("case", REFERENCE["partialDates"])
def test_partial_date_output_matches_executed_reference(case):
    value = _decode(case["input"])
    assert partial_date_integer_to_string(value) == case["string"]
    _assert_number(partial_date_integer_to_year(value), case["year"])
    _assert_number(partial_date_integer_to_month(value), case["month"])
    _assert_number(partial_date_integer_to_day(value), case["day"])


@pytest.mark.parametrize("value, nullable, text", [(None, None, ""), ("", None, ""), (" ", " ", " "), (0, 0, 0), (False, False, False), ("0", "0", "0")])
def test_null_and_empty_are_not_globally_collapsed(value, nullable, text):
    assert empty_string_to_none(value) == nullable
    assert null_to_empty_string(value) == text


@pytest.mark.parametrize("case", [case for case in REFERENCE["searches"] if not case["searchType"]])
def test_name_tokenization_matches_executed_reference(case):
    assert name_search_tokens(case["query"]) == tuple(case["parameters"])


def test_search_values_remain_bound_instead_of_becoming_sql():
    payload = "o'brien%; DROP TABLE Users; --"
    name = column("purchaserName", Unicode(200))
    query = select(name).where(*contains_name_predicates(name, payload))
    compiled = query.compile(dialect=mssql.dialect())
    assert payload.lower() not in str(compiled)
    assert "drop" in compiled.params.values()
    assert "Users" not in str(compiled)


def test_blank_search_and_unrecognized_contract_time_add_no_filters():
    name = column("burialSiteName", Unicode(200))
    assert burial_site_name_predicates(name, "") == ()
    assert burial_site_name_predicates(name, "", "startsWith") == ()
    assert contains_name_predicates(name, "   ") == ()
    assert contract_time_predicates(column("startDate"), column("endDate"), None, 20261019) == ()
    assert contract_time_predicates(column("startDate"), column("endDate"), "unknown", 20261019) == ()

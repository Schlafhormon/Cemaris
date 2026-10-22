"""Shared Sunrise data semantics for the SQL Server port.

Derived from Sunrise CMS (MIT), helpers/partialDate.helpers.ts,
helpers/database.helpers.ts and helpers/functions.sqlFilters.ts at commit
451ce034863b16502484367044f3e9b65370111a. See licenses/Sunrise-LICENSE.md.

Dates remain YYYYMMDD numbers, including the source's deliberately partial
dates. Search preserves SQLite's ASCII-only case folding rather than inheriting
the SQL Server database's collation. Requires SQL Server 2019+ (UTF-8 LIKE).
"""

from __future__ import annotations

import math
import re
from datetime import date
from typing import TypeVar

from sqlalchemy import Integer, String, Unicode, cast, column as sql_column, false, func, literal, literal_column, or_, select, true, values
from sqlalchemy.dialects.mssql import BINARY
from sqlalchemy.sql.elements import ColumnElement


BINARY_COLLATION = "Latin1_General_100_BIN2"
_UTF8_BINARY_COLLATION = "Latin1_General_100_BIN2_UTF8"
_UTF8_CONVERSION_COLLATION = "Latin1_General_100_CS_AS_SC_UTF8"
_ASCII_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
_ASCII_LOWER = "abcdefghijklmnopqrstuvwxyz"
_ASCII_TRANSLATION = str.maketrans(_ASCII_UPPER, _ASCII_LOWER)
# ECMAScript WhiteSpace + LineTerminator; Python also strips other characters.
_JS_WHITESPACE = "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"
_DECIMAL_NUMBER = re.compile(r"[+-]?(?:(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?|Infinity)\Z")
_RADIX_NUMBER = re.compile(r"0(?:[xX][0-9a-fA-F]+|[bB][01]+|[oO][0-7]+)\Z")
FormNumber = int | float | str | None
_T = TypeVar("_T")


def js_number(value: FormNumber) -> float:
    """ECMAScript Number coercion for scalar form inputs, using binary64.

    In particular, empty/whitespace and null are zero; malformed input is NaN.
    This is intentionally not a decimal-money conversion or an input validator.
    """
    if value is None:
        return 0.0
    if not isinstance(value, str):
        return float(value)
    value = value.strip(_JS_WHITESPACE)
    if not value:
        return 0.0
    if _RADIX_NUMBER.fullmatch(value):
        return float(int(value, 0))
    return float(value) if _DECIMAL_NUMBER.fullmatch(value) else math.nan


def sanitize_limit(value: FormNumber) -> int | float:
    """Sunrise's limit: invalid/negative -> 50; otherwise floor, including 0."""
    number = js_number(value)
    if math.isnan(number) or number < 0:
        return 50
    return math.floor(number) if math.isfinite(number) else number


def sanitize_offset(value: FormNumber) -> int | float:
    """Sunrise's offset: invalid/negative -> 0; otherwise floor."""
    number = js_number(value)
    if math.isnan(number) or number < 0:
        return 0
    return math.floor(number) if math.isfinite(number) else number


def empty_string_to_none(value: _T | str | None) -> _T | str | None:
    """The source's explicit empty form-field -> SQL NULL rule; retain zero."""
    return None if value is None or value == "" else value


def null_to_empty_string(value: _T | None) -> _T | str:
    """The source's nullish text fallback; preserve false and numeric zero."""
    return "" if value is None else value


def date_parts_to_integer(year: FormNumber, month: FormNumber = "", day: FormNumber = "") -> float | None:
    """Port datePartsToInteger exactly, including clamping and fractional input.

    The reference does not check calendar validity or require integer parts.
    Its invalid-year undefined result is represented by None for SQL NULL.
    """
    year_number = js_number(year)
    if math.isnan(year_number) or year_number <= 0:
        return None
    month_number = js_number(month)
    day_number = js_number(day)
    month_number = 0.0 if math.isnan(month_number) else max(0.0, min(12.0, month_number))
    day_number = 0.0 if math.isnan(day_number) else max(0.0, min(31.0, day_number))
    return year_number * 10_000 + month_number * 100 + day_number


def _valid_partial_date(value: int | float | None) -> bool:
    return value is not None and not math.isnan(value) and value > 0


def _js_number_string(value: int | float) -> str:
    """Number.toString formatting for the date helpers' scalar number range."""
    number = float(value)
    if math.isinf(number):
        return "Infinity" if number > 0 else "-Infinity"
    if math.isnan(number):
        return "NaN"
    if number == 0:
        return "0"
    if number.is_integer() and abs(number) < 1e16:
        return str(int(number))
    rendered = repr(number)
    if "e" in rendered:
        base, exponent = rendered.split("e")
        exponent_number = int(exponent)
        if -6 <= exponent_number < 21:
            # Python's repr switches to exponent notation earlier than JS.
            from decimal import Decimal

            return format(Decimal(rendered), "f")
        base = base.removesuffix(".0")
        return f"{base}e{'+' if exponent_number >= 0 else '-'}{abs(exponent_number)}"
    return rendered


def partial_date_integer_to_string(value: int | float | None) -> str:
    if not _valid_partial_date(value):
        return ""
    date_string = ("00000000" + _js_number_string(value))[-8:]
    year, month, day = date_string[:4], date_string[4:6], date_string[6:8]
    if month == "00":
        return year
    return f"{year}-{month}" if day == "00" else f"{year}-{month}-{day}"


def partial_date_integer_to_year(value: int | float | None) -> int | float | None:
    if not _valid_partial_date(value):
        return None
    return math.floor(value / 10_000) if math.isfinite(value) else value


def partial_date_integer_to_month(value: int | float | None) -> int | float:
    if not _valid_partial_date(value):
        return 0
    return math.floor(value % 10_000 / 100) if math.isfinite(value) else math.nan


def partial_date_integer_to_day(value: int | float | None) -> int | float:
    if not _valid_partial_date(value):
        return 0
    return value % 100 if math.isfinite(value) else math.nan


def name_search_tokens(query: str = "") -> tuple[str, ...]:
    """JS lowercase query, split only ASCII spaces, remove empty/duplicate parts."""
    return tuple(dict.fromkeys(piece for piece in query.lower().split(" ") if piece))


def sqlite_ascii_lower(column: ColumnElement[str]) -> ColumnElement[str]:
    """SQLite lower(), without SQL Server's additional Unicode case folding."""
    return func.translate(
        cast(column, Unicode()).collate(BINARY_COLLATION),
        literal(_ASCII_UPPER, type_=Unicode()),
        literal(_ASCII_LOWER, type_=Unicode()),
    ).collate(BINARY_COLLATION)


def contains_name_predicates(column: ColumnElement[str], query: str = "") -> tuple[ColumnElement[bool], ...]:
    """AND of literal substring matches shared by purchaser/deceased/site names."""
    lowered_column = sqlite_ascii_lower(column)
    return tuple(
        func.charindex(literal(piece, type_=Unicode()), lowered_column) > 0
        for piece in name_search_tokens(query)
    )


def _scalar_wildcard_predicate(column: ColumnElement[str], query: str, search_type: str) -> ColumnElement[bool]:
    """Use binary LIKE on fixed-width scalar encodings for an active underscore.

    BIN2 LIKE counts supplementary UTF-16 characters twice, even with UTF-8.
    Linguistic SC LIKE counts scalars but equates some distinct Unicode text.
    SC SUBSTRING/UNICODE plus ordered hexadecimal tokens preserves both scalar
    wildcards and exact non-ASCII literals. Only underscore searches need this
    conversion; ordinary prefix/suffix searches keep the simpler native path.
    """
    maximum = getattr(column.type, "length", None) or 4000
    if sum(character != "%" for character in query) > maximum:
        return false()
    digits = values(sql_column("digit", Integer()), name="search_digits").data([(number,) for number in range(10)])
    aliases = [digits.alias("search_digits_" + str(index)) for index in range(len(str(maximum - 1)))]
    position = literal_column("1")
    source = aliases[0]
    for index, alias in enumerate(aliases):
        position = position + alias.c.digit * literal_column(str(10 ** index))
        if index:
            source = source.join(alias, true())
    # This collation is used for code-point extraction only, never comparison.
    text = sqlite_ascii_lower(column).collate(_UTF8_CONVERSION_COLLATION)
    codepoint = func.unicode(func.substring(text, position, literal_column("1")))
    hexadecimal = func.convert(literal_column("varchar(8)"), cast(codepoint, BINARY(4)), literal_column("2"))
    token = cast(literal(":", type_=String()) + hexadecimal, String())
    tokens = select(token.label("token"), position.label("position")).select_from(source).where(
        position <= func.len(text + literal("\x01", type_=Unicode())) - 1,
    ).correlate_except(source).subquery()
    aggregate = func.string_agg(tokens.c.token, literal_column("''", String(1))).within_group(tokens.c.position)
    encoded = select(aggregate).scalar_subquery()
    encoded = cast(encoded, String()).collate(BINARY_COLLATION)
    pattern = "".join("%" if character == "%" else ":________" if character == "_" else f":{ord(character):08X}"
                      for character in query.translate(_ASCII_TRANSLATION))
    pattern = pattern + "%" if search_type == "startsWith" else "%" + pattern
    return encoded.like(literal(pattern, type_=String()).collate(BINARY_COLLATION))


def burial_site_name_predicates(
    column: ColumnElement[str], query: str = "", search_type: str = ""
) -> tuple[ColumnElement[bool], ...]:
    """Burial-site filter, retaining SQLite LIKE's active % and _ wildcards.

    SQL Server additionally treats [ as a wildcard. Escape that character and
    the chosen escape prefix, while leaving %/_ active as in the reference.
    Underscore patterns use scalar encoding because BIN2 LIKE counts surrogate
    halves even under UTF-8. Other patterns append CHAR(1) on both sides so
    VARCHAR LIKE cannot silently ignore the text's trailing spaces.
    """
    if not query:
        return ()
    if search_type not in ("startsWith", "endsWith"):
        return contains_name_predicates(column, query)
    if "_" in query:
        return (_scalar_wildcard_predicate(column, query, search_type),)
    pattern = query.translate(_ASCII_TRANSLATION).replace("!", "!!").replace("[", "![")
    pattern = pattern + "%" if search_type == "startsWith" else "%" + pattern
    # Convert before TRANSLATE: nested BIN2 NVARCHAR function expressions can
    # otherwise lose supplementary characters during their VARCHAR conversion.
    # BIN2_UTF8 alone loses supplementary characters when converting a stored
    # BIN2 NVARCHAR column (unlike a Unicode literal). Convert with SC first,
    # then apply binary comparison so linguistic equivalences cannot leak in.
    utf8_column = cast(cast(column, Unicode()).collate(_UTF8_CONVERSION_COLLATION), String()).collate(_UTF8_BINARY_COLLATION)
    utf8_column = func.translate(
        utf8_column,
        literal(_ASCII_UPPER, type_=String()),
        literal(_ASCII_LOWER, type_=String()),
    ).collate(_UTF8_BINARY_COLLATION)
    utf8_pattern = cast(literal(pattern, type_=Unicode()).collate(_UTF8_CONVERSION_COLLATION), String()).collate(_UTF8_BINARY_COLLATION)
    sentinel = func.char(1).collate(_UTF8_BINARY_COLLATION)
    match = utf8_column + sentinel
    pattern = utf8_pattern + sentinel
    return (match.like(pattern, escape="!"),)


def date_to_integer(value: date) -> int:
    return value.year * 10_000 + value.month * 100 + value.day


def contract_time_predicates(
    start_column: ColumnElement[int],
    end_column: ColumnElement[int],
    contract_time: str | None,
    current_date: date | int | None = None,
) -> tuple[ColumnElement[bool], ...]:
    """Source current/past/future filters, retaining inclusive ends and NULLs.

    Callers may supply their configured application-local date; the default
    follows the reference's server-local calendar date rather than UTC.
    """
    today = current_date if current_date is not None else date.today()
    today_integer = date_to_integer(today) if isinstance(today, date) else today
    if contract_time == "current":
        return (start_column <= today_integer, or_(end_column.is_(None), end_column >= today_integer))
    if contract_time == "future":
        return (start_column > today_integer,)
    if contract_time == "past":
        return (end_column < today_integer,)
    return ()

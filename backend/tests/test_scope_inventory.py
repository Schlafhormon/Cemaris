"""The completion gate checks reviewed mappings, never invents runtime evidence."""
from copy import deepcopy
import importlib.util
from pathlib import Path

import pytest

_SPEC = importlib.util.spec_from_file_location(
    "check_scope", Path(__file__).resolve().parents[2] / "scripts/check_scope.py"
)
scope = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(scope)


@pytest.fixture
def reviewed_inventory(tmp_path):
    (tmp_path / "implementation.py").write_text("# Synthetic implementation\n")
    (tmp_path / "evidence.py").write_text("# Synthetic evidence pointer\n")
    feature = {
        "id": "F-synthetic", "target": "implementation.py",
        "implementation_status": "implementiert; live ungeprüft",
        "completion": {
            "classification": "implemented", "rationale": "Synthetic reviewed mapping",
            "target_paths": ["implementation.py"], "evidence_paths": ["evidence.py"],
        },
    }
    return {
        "final_audit": {"summary": "Synthetic audit"}, "features": [feature],
        "foundation_features": [],
        "locked_packages": [{"lock_path": "node_modules/synthetic", "content_verification": "Contribution mapped; no execution claimed"}],
    }


def test_reviewed_mapping_allows_explicit_live_verification_limit(tmp_path, reviewed_inventory):
    assert scope.validate_completion(reviewed_inventory, tmp_path) == {"implemented": 1}


@pytest.mark.parametrize("field,value,error", [
    ("target", "geplant/offen", "Unassigned implementation"),
    ("implementation_status", "offen", "Unassigned implementation"),
    ("classification", "passed", "classification/rationale"),
    ("rationale", "", "classification/rationale"),
    ("target_paths", [], "Missing target_paths"),
    ("target_paths", ["missing.py"], "Missing/outside repository"),
    ("evidence_paths", ["missing.py"], "Missing/outside repository"),
    ("target_paths", ["../outside.py"], "Missing/outside repository"),
    ("target_paths", [""], "Invalid target_paths"),
    ("target_paths", [17], "Invalid target_paths"),
])
def test_incomplete_mapping_cannot_pass(tmp_path, reviewed_inventory, field, value, error):
    data = deepcopy(reviewed_inventory)
    feature = data["features"][0]
    if field in {"target", "implementation_status"}:
        feature[field] = value
    else:
        feature["completion"][field] = value
    with pytest.raises(ValueError, match=error):
        scope.validate_completion(data, tmp_path)


def test_absolute_existing_path_is_not_a_repository_mapping(tmp_path, reviewed_inventory):
    reviewed_inventory["features"][0]["completion"]["target_paths"] = [str(tmp_path / "implementation.py")]
    with pytest.raises(ValueError, match="Missing/outside repository"):
        scope.validate_completion(reviewed_inventory, tmp_path)


@pytest.mark.parametrize("status", ["offen; lock metadata only", "OFFEN", "geplant", " "])
def test_unmapped_package_contribution_cannot_pass(tmp_path, reviewed_inventory, status):
    reviewed_inventory["locked_packages"][0]["content_verification"] = status
    with pytest.raises(ValueError, match="Unassigned package contribution"):
        scope.validate_completion(reviewed_inventory, tmp_path)


def test_absent_final_audit_cannot_pass(tmp_path, reviewed_inventory):
    reviewed_inventory.pop("final_audit")
    with pytest.raises(ValueError, match="Final audit summary"):
        scope.validate_completion(reviewed_inventory, tmp_path)


def test_documented_product_removal_has_no_active_implementation(tmp_path, reviewed_inventory):
    feature = reviewed_inventory["features"][0]
    feature["target"] = "Removed by explicit product decision"
    feature["implementation_status"] = "Entfernt durch Produktauftrag"
    feature["completion"].update(classification="removed_by_product_decision",
        rationale="Retired external integration", target_paths=[], decision_report="evidence.py")
    assert scope.validate_completion(reviewed_inventory, tmp_path) == {"removed_by_product_decision": 1}
    feature["completion"]["target_paths"] = ["implementation.py"]
    with pytest.raises(ValueError, match="no active targets"):
        scope.validate_completion(reviewed_inventory, tmp_path)


def test_removal_class_requires_explicit_decision_evidence(tmp_path, reviewed_inventory):
    feature = reviewed_inventory["features"][0]
    feature["completion"].update(classification="removed_by_product_decision", target_paths=[])
    with pytest.raises(ValueError, match="decision report"):
        scope.validate_completion(reviewed_inventory, tmp_path)

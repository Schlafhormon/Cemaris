import pytest
from sqlalchemy.engine import URL

from cemaris.db.engine import create_database_engine


def test_engine_creation_is_lazy_and_hides_parameters():
    engine = create_database_engine(URL.create(
        "mssql+pyodbc", host="invalid.example", database="Cemaris",
        query={"driver": "ODBC Driver 18 for SQL Server"},
    ))
    assert engine.hide_parameters
    assert engine.dialect.name == "mssql"
    engine.dispose()


@pytest.mark.parametrize("url", ["sqlite:///test.db", "mssql+pyodbc://host"])
def test_engine_rejects_wrong_database_contract(url):
    with pytest.raises(ValueError, match="mssql\\+pyodbc"):
        create_database_engine(url)

import threading
from typing import List, Dict, Any

_lock = threading.Lock()

records: List[Dict[str, Any]] = [
    {"id": 1,  "firm": "Acme Corporation",  "status": "Finished",    "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-04-05", "employee": "Sarah Johnson"},
    {"id": 2,  "firm": "TechStart Inc.",    "status": "In Progress", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-04-08", "employee": "Michael Chen"},
    {"id": 3,  "firm": "Global Logistics",  "status": "Not Started", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-03-28", "employee": "Maria Chicus"},
    {"id": 4,  "firm": "Riverside Medical", "status": "In Progress", "periodMonth": 2, "periodYear": 2026, "dateBrought": "2026-04-02", "employee": "Sarah Johnson"},
    {"id": 5,  "firm": "Downtown Retail",   "status": "Finished",    "periodMonth": 1, "periodYear": 2026, "dateBrought": "2026-03-10", "employee": "Michael Chen"},
    {"id": 6,  "firm": "Mountain Coffee",   "status": "Not Started", "periodMonth": 1, "periodYear": 2026, "dateBrought": "2026-03-15", "employee": "Maria Chicus"},
    {"id": 7,  "firm": "Precision Tech",    "status": "Finished",    "periodMonth": 1, "periodYear": 2026, "dateBrought": "2026-03-03", "employee": "Sarah Johnson"},
    {"id": 8,  "firm": "Blue Wave Agency",  "status": "In Progress", "periodMonth": 1, "periodYear": 2026, "dateBrought": "2026-03-18", "employee": "Michael Chen"},
    {"id": 9,  "firm": "Valley Education",  "status": "Finished",    "periodMonth": 0, "periodYear": 2026, "dateBrought": "2026-02-12", "employee": "Maria Chicus"},
    {"id": 10, "firm": "Acme Corporation",  "status": "Finished",    "periodMonth": 0, "periodYear": 2026, "dateBrought": "2026-02-08", "employee": "Sarah Johnson"},
    {"id": 11, "firm": "TechStart Inc.",    "status": "In Progress", "periodMonth": 0, "periodYear": 2026, "dateBrought": "2026-02-20", "employee": "Michael Chen"},
    {"id": 12, "firm": "Global Logistics",  "status": "Not Started", "periodMonth": 0, "periodYear": 2026, "dateBrought": "2026-02-25", "employee": "Maria Chicus"},
]

companies: List[Dict[str, Any]] = [
    {"id": 1,  "name": "Valley Education",       "phone": "+40 758 177 097", "email": "finance@valleyedu.org",   "address": "Str. Visinului, Bacau",               "contactPerson": {"name": "Dr. Sarah Mitchell", "email": "sarah.mitchell@valleyedu.org"}, "observations": []},
    {"id": 2,  "name": "Acme Corporation",        "phone": "+40 722 100 200", "email": "info@acme.com",           "address": "Bulevardul Eroilor, Cluj-Napoca",     "contactPerson": {"name": "John Doe",           "email": "j.doe@acme.com"},                "observations": []},
    {"id": 3,  "name": "TechStart Inc.",          "phone": "+40 744 333 444", "email": "contact@techstart.io",   "address": "Str. Memorandumului, Cluj-Napoca",    "contactPerson": {"name": "Alice Vance",        "email": "alice@techstart.io"},            "observations": []},
    {"id": 4,  "name": "Global Logistics",        "phone": "+40 733 555 666", "email": "logistics@global.ro",    "address": "Calea Turzii, Cluj-Napoca",           "contactPerson": {"name": "Mark Stevens",       "email": "m.stevens@global.ro"},           "observations": []},
    {"id": 5,  "name": "Riverside Medical",       "phone": "+40 788 111 222", "email": "office@riverside.med",   "address": "Str. Clinicilor, Cluj-Napoca",        "contactPerson": {"name": "Elena Popescu",      "email": "e.popescu@riverside.med"},       "observations": []},
    {"id": 6,  "name": "Downtown Retail",         "phone": "+40 755 999 000", "email": "sales@downtown.ro",      "address": "Str. Regele Ferdinand, Cluj-Napoca", "contactPerson": {"name": "George Marin",       "email": "g.marin@downtown.ro"},           "observations": []},
    {"id": 7,  "name": "Mountain Coffee",         "phone": "+40 741 222 333", "email": "hello@mtncoffee.com",    "address": "Str. Avram Iancu, Brasov",            "contactPerson": {"name": "Ana Maria",          "email": "ana@mtncoffee.com"},             "observations": []},
    {"id": 8,  "name": "Precision Tech",          "phone": "+40 725 666 777", "email": "eng@prectech.ro",        "address": "Zona Industriala, Sibiu",             "contactPerson": {"name": "Victor Ionescu",     "email": "v.ionescu@prectech.ro"},         "observations": []},
    {"id": 9,  "name": "Blue Wave Agency",        "phone": "+40 732 444 555", "email": "ads@bluewave.ro",        "address": "Str. Constanta, Mamaia",              "contactPerson": {"name": "Laura Dumitru",      "email": "laura@bluewave.ro"},             "observations": []},
    {"id": 10, "name": "Green Energy Solutions",  "phone": "+40 766 888 999", "email": "solar@greenenergy.ro",   "address": "Soseaua Pipera, Bucuresti",           "contactPerson": {"name": "Radu Filipescu",     "email": "r.filipescu@greenenergy.ro"},    "observations": []},
]

_counters: Dict[str, int] = {"records": 12, "companies": 10, "observations": 0}


def next_id(entity: str) -> int:
    with _lock:
        _counters[entity] += 1
        return _counters[entity]

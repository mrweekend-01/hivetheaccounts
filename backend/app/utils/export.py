import csv
import io
from openpyxl import Workbook
from app.crud import account as crud_account

HEADERS = ["ID", "Correo corporativo", "Nombre de perfil", "Estado", "Celular",
           "Facebook", "Instagram", "TikTok", "Notas"]


def _rows(accounts):
    for acc in accounts:
        pres = crud_account.socials_presence(acc)
        yield [
            acc.id, acc.corporate_email, acc.profile_name or "", acc.status.value,
            acc.device.name if acc.device else "",
            pres.facebook.value, pres.instagram.value, pres.tiktok.value,
            acc.notes or "",
        ]


def to_csv(accounts) -> io.BytesIO:
    sio = io.StringIO()
    w = csv.writer(sio)
    w.writerow(HEADERS)
    for row in _rows(accounts):
        w.writerow(row)
    return io.BytesIO(sio.getvalue().encode("utf-8-sig"))


def to_xlsx(accounts) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "Cuentas"
    ws.append(HEADERS)
    for row in _rows(accounts):
        ws.append(row)
    for i, _ in enumerate(HEADERS, start=1):
        ws.column_dimensions[chr(64 + i)].width = 20
    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    return bio

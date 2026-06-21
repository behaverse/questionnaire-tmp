import psycopg
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from .deps import get_conn
from .identity import require_researcher
from ..config import get_settings
from .. import export_csv
from ..store import deployments as dep_store
from ..store import export as export_store

router = APIRouter()


@router.get("/deployments/{deployment_id}/export.csv")
def export(deployment_id: str, conn=Depends(get_conn),
           claims=Depends(require_researcher)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    columns = export_csv.response_columns(str(get_settings().schemas_dir))

    def stream():
        # own connection for the stream (request-scoped conn above is only for the 404 check)
        with psycopg.connect(get_settings().database_url) as c:
            yield from export_csv.to_csv(export_store.iter_response_rows(c, deployment_id), columns)

    return StreamingResponse(stream(), media_type="text/csv", headers={
        "Content-Disposition": f'attachment; filename="{deployment_id}_responses.csv"'})

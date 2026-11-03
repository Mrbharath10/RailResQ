from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import ScenarioRunRequest
from app.services.simulator_service import simulator

router = APIRouter(prefix="/simulator", tags=["Academic Emergency Scenario Simulator"])


@router.get("/scenarios", summary="List Built-in Emergency Scenarios")
def list_scenarios():
    return simulator.get_available_scenarios()


@router.post("/run", summary="Execute Full Scenario Simulation Pipeline")
async def run_scenario(request: ScenarioRunRequest, db: Session = Depends(get_db)):
    try:
        result = await simulator.execute_scenario(db, request.scenario_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

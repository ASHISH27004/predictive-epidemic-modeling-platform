"""
SEIR Differential Equations Solver

Extended SEIR model with mortality, vaccination, and climate modulation.
Uses SciPy's odeint for numerical integration.

Equations:
  dS/dt = -β*S*I/N - ν*S                  (Susceptible)
  dE/dt = β*S*I/N - σ*E                   (Exposed)
  dI/dt = σ*E - γ*I - μ*I                 (Infectious)
  dR/dt = γ*I + ν*S*(1-ε)                 (Recovered)
  dD/dt = μ*I                             (Deceased)

Where:
  β = transmission rate (climate-modulated)
  σ = incubation rate (1/incubation_period)
  γ = recovery rate (1/recovery_period)
  μ = mortality rate
  ν = vaccination rate
  ε = vaccine efficacy
"""

from typing import List, Dict, Tuple
import numpy as np
from scipy.integrate import odeint


def compute_beta_modulated(
    base_beta: float,
    avg_temp: float,
    humidity: float,
    mask_compliance: float,
    isolation_index: float,
) -> float:
    """Compute climate and intervention-modulated transmission rate."""
    # Temperature effect: peak transmission around 10-15°C
    temp_factor = 1 + 0.02 * np.exp(-((avg_temp - 12) ** 2) / 100)

    # Humidity effect: moderate humidity (40-60%) increases transmission
    humidity_factor = 1 + 0.1 * np.exp(-((humidity - 50) ** 2) / 2000)

    # Mask compliance reduces effective contact
    mask_factor = 1 - (mask_compliance / 100) * 0.6

    # Isolation reduces mixing
    isolation_factor = 1 - isolation_index * 0.7

    return max(0.01, base_beta * temp_factor * humidity_factor * mask_factor * isolation_factor)


def seir_deriv(
    y: np.ndarray,
    t: float,
    N: float,
    beta: float,
    sigma: float,
    gamma: float,
    mu: float,
    vaccine_rate: float,
    vaccine_efficacy: float,
    mobility_in: float = 0.0,
) -> np.ndarray:
    """
    Compute SEIRD derivatives.
    
    y = [S, E, I, R, D]
    """
    S, E, I, R, D = y
    v_rate = (vaccine_rate / 100) * 0.01  # Convert percentage to daily rate
    ve = vaccine_efficacy / 100

    # Force of infection
    contact_term = beta * S * I / N if N > 0 else 0
    vaccination_term = v_rate * S

    dS = -contact_term - vaccination_term + mobility_in
    dE = contact_term - sigma * E
    dI = sigma * E - gamma * I - mu * I
    dR = gamma * I + vaccination_term * (1 - ve)
    dD = mu * I

    return np.array([dS, dE, dI, dR, dD])


def solve_seir(
    population: float,
    initial_seir: Dict[str, float],
    params: Dict,
    days: int,
    avg_temp: float = 15.0,
    humidity: float = 60.0,
    mobility_flows: List[Tuple[int, float]] = None,
) -> List[Dict[str, float]]:
    """
    Solve SEIR model for a single node using odeint.
    
    Returns list of SEIR states for each day.
    """
    if mobility_flows is None:
        mobility_flows = []

    N = population
    y0 = np.array([
        initial_seir["S"],
        initial_seir["E"],
        initial_seir["I"],
        initial_seir["R"],
        initial_seir["D"],
    ])

    beta = compute_beta_modulated(
        params["beta"], avg_temp, humidity,
        params["mask_compliance"], params["isolation_index"],
    )

    # Time points (daily)
    t = np.linspace(0, days, days * 10 + 1)  # 10 substeps per day for accuracy

    # Build mobility interpolation
    mob_dict = {day: flow for day, flow in mobility_flows}

    def get_mobility(time_val: float) -> float:
        day = int(time_val)
        return mob_dict.get(day, 0.0) / 10  # Distribute over substeps

    # Solve with odeint
    def deriv_wrapper(y, time_val):
        mob = get_mobility(time_val)
        return seir_deriv(
            y, time_val, N, beta,
            params["sigma"], params["gamma"], params["mu"],
            params["vaccine_rate"], params["vaccine_efficacy"],
            mob,
        )

    solution = odeint(deriv_wrapper, y0, t, rtol=1e-8, atol=1e-10)

    # Extract daily snapshots
    daily_states = []
    step_size = len(solution) // (days + 1)
    if step_size == 0:
        step_size = 1

    for i in range(days + 1):
        idx = min(i * step_size, len(solution) - 1)
        state = solution[idx]
        # Clamp negatives
        state = np.maximum(state, 0)
        daily_states.append({
            "S": float(state[0]),
            "E": float(state[1]),
            "I": float(state[2]),
            "R": float(state[3]),
            "D": float(state[4]),
        })

    return daily_states


def verify_population_conservation(
    trajectory: List[Dict[str, float]],
    expected_n: float,
    tolerance: float = 0.01,
) -> Dict:
    """Verify S+E+I+R+D = N at all timepoints."""
    max_drift = 0
    max_drift_day = 0

    for i, state in enumerate(trajectory):
        total = state["S"] + state["E"] + state["I"] + state["R"] + state["D"]
        drift = abs(total - expected_n)
        if drift > max_drift:
            max_drift = drift
            max_drift_day = i

    return {
        "conserved": max_drift < tolerance,
        "max_drift": max_drift,
        "max_drift_day": max_drift_day,
    }


def compute_r0(beta: float, gamma: float, mu: float) -> float:
    """R0 = β / (γ + μ)"""
    return beta / (gamma + mu)


def compute_beta_from_r0(r0: float, gamma: float, mu: float) -> float:
    """β = R0 * (γ + μ)"""
    return r0 * (gamma + mu)

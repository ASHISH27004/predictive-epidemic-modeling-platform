"""
Verification Tests for SEIR Solver

Tests population conservation, R0 computation, and basic solver behavior.
"""

import sys
sys.path.insert(0, '.')

from backend.app.core.seir_solver import (
    solve_seir,
    verify_population_conservation,
    compute_r0,
    compute_beta_from_r0,
)


def test_population_conservation():
    """Verify S + E + I + R + D = N at all timepoints."""
    population = 10.0  # 10 million
    initial = {"S": 9.999, "E": 0, "I": 0.001, "R": 0, "D": 0}
    params = {
        "beta": 0.3,
        "sigma": 1 / 5.2,
        "gamma": 1 / 10,
        "mu": 0.005,
        "vaccine_rate": 0,
        "vaccine_efficacy": 0,
        "mask_compliance": 0,
        "isolation_index": 0,
    }

    trajectory = solve_seir(population, initial, params, 30, 15.0, 60.0)

    verification = verify_population_conservation(trajectory, population)

    assert verification["conserved"], (
        f"Population not conserved! "
        f"Max drift: {verification['max_drift']:.6f}M at day {verification['max_drift_day']}"
    )
    print(f"✓ Population conservation verified (max drift: {verification['max_drift']:.8f}M)")


def test_r0_computation():
    """Verify R0 = β / (γ + μ)."""
    beta = 0.3
    gamma = 0.1
    mu = 0.005

    r0 = compute_r0(beta, gamma, mu)
    expected_r0 = beta / (gamma + mu)

    assert abs(r0 - expected_r0) < 1e-10, f"R0 mismatch: {r0} vs {expected_r0}"
    print(f"✓ R0 computation verified: R₀ = {r0:.3f}")

    # Verify inverse
    computed_beta = compute_beta_from_r0(r0, gamma, mu)
    assert abs(computed_beta - beta) < 1e-10
    print(f"✓ Beta from R0 verified: β = {computed_beta:.3f}")


def test_basic_solver_behavior():
    """Verify solver produces monotonically increasing deaths and bounded values."""
    population = 10.0
    initial = {"S": 9.99, "E": 0, "I": 0.01, "R": 0, "D": 0}
    params = {
        "beta": 0.4,
        "sigma": 1 / 5.2,
        "gamma": 1 / 10,
        "mu": 0.01,
        "vaccine_rate": 0,
        "vaccine_efficacy": 0,
        "mask_compliance": 0,
        "isolation_index": 0,
    }

    trajectory = solve_seir(population, initial, params, 60, 15.0, 60.0)

    # Deaths should be non-decreasing
    for i in range(1, len(trajectory)):
        assert trajectory[i]["D"] >= trajectory[i-1]["D"], (
            f"Deaths decreased at day {i}: {trajectory[i]['D']} < {trajectory[i-1]['D']}"
        )

    # All values should be non-negative and bounded
    for i, state in enumerate(trajectory):
        for key, val in state.items():
            assert val >= 0, f"Negative {key} at day {i}: {val}"
            assert val <= population, f"{key} exceeded population at day {i}: {val}"

    print(f"✓ Solver behavior verified (60 days, {len(trajectory)} snapshots)")


def test_climate_modulation():
    """Verify temperature and humidity modulate transmission."""
    initial = {"S": 9.99, "E": 0, "I": 0.01, "R": 0, "D": 0}
    params = {
        "beta": 0.3,
        "sigma": 1 / 5.2,
        "gamma": 1 / 10,
        "mu": 0.005,
        "vaccine_rate": 0,
        "vaccine_efficacy": 0,
        "mask_compliance": 0,
        "isolation_index": 0,
    }

    # Optimal temp (12°C) should have higher transmission
    warm = solve_seir(10.0, initial, params, 30, 12.0, 50.0)
    # Extreme temp (30°C) should have lower transmission
    hot = solve_seir(10.0, initial, params, 30, 30.0, 50.0)

    assert warm[30]["I"] >= hot[30]["I"], (
        "Optimal temperature should produce higher transmission"
    )
    print(f"✓ Climate modulation verified (warm I={warm[30]['I']:.4f}, hot I={hot[30]['I']:.4f})")


def test_intervention_effects():
    """Verify interventions reduce transmission."""
    initial = {"S": 9.99, "E": 0, "I": 0.01, "R": 0, "D": 0}
    base_params = {
        "beta": 0.3,
        "sigma": 1 / 5.2,
        "gamma": 1 / 10,
        "mu": 0.005,
        "vaccine_rate": 0,
        "vaccine_efficacy": 0,
    }

    # No interventions
    no_intervention = solve_seir(10.0, initial, {**base_params, "mask_compliance": 0, "isolation_index": 0}, 30, 15.0, 60.0)

    # High mask compliance
    masks = solve_seir(10.0, initial, {**base_params, "mask_compliance": 80, "isolation_index": 0}, 30, 15.0, 60.0)

    # High isolation
    isolation = solve_seir(10.0, initial, {**base_params, "mask_compliance": 0, "isolation_index": 0.8}, 30, 15.0, 60.0)

    assert masks[30]["I"] < no_intervention[30]["I"], "Masks should reduce infections"
    assert isolation[30]["I"] < no_intervention[30]["I"], "Isolation should reduce infections"

    print(f"✓ Intervention effects verified")
    print(f"  No intervention: I = {no_intervention[30]['I']:.4f}")
    print(f"  80% masks:       I = {masks[30]['I']:.4f}")
    print(f"  80% isolation:   I = {isolation[30]['I']:.4f}")


if __name__ == "__main__":
    print("Running SEIR Solver Verification Tests\n")
    test_population_conservation()
    test_r0_computation()
    test_basic_solver_behavior()
    test_climate_modulation()
    test_intervention_effects()
    print("\n✅ All verification tests passed!")

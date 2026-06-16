"""
City Transport Network Simulation

Models inter-city mobility and pathogen spread using NetworkX graph.
Cities are nodes, flights/highways are weighted edges.
"""

import networkx as nx
import numpy as np
from typing import Dict, List, Tuple
from backend.app.core.seir_solver import (
    solve_seir,
    compute_beta_from_r0,
    verify_population_conservation,
)

# Global mega-city dataset
CITIES = [
    {"id": "nyc", "name": "New York", "country": "USA", "lat": 40.7128, "lng": -74.006, "population": 8.3, "region": "NA", "avg_temp": 12.8, "humidity": 62},
    {"id": "lax", "name": "Los Angeles", "country": "USA", "lat": 34.0522, "lng": -118.2437, "population": 3.9, "region": "NA", "avg_temp": 18.6, "humidity": 65},
    {"id": "chi", "name": "Chicago", "country": "USA", "lat": 41.8781, "lng": -87.6298, "population": 2.7, "region": "NA", "avg_temp": 10.0, "humidity": 68},
    {"id": "lon", "name": "London", "country": "UK", "lat": 51.5074, "lng": -0.1278, "population": 8.9, "region": "EU", "avg_temp": 11.3, "humidity": 78},
    {"id": "par", "name": "Paris", "country": "France", "lat": 48.8566, "lng": 2.3522, "population": 2.2, "region": "EU", "avg_temp": 12.3, "humidity": 75},
    {"id": "ber", "name": "Berlin", "country": "Germany", "lat": 52.52, "lng": 13.405, "population": 3.6, "region": "EU", "avg_temp": 9.7, "humidity": 72},
    {"id": "mos", "name": "Moscow", "country": "Russia", "lat": 55.7558, "lng": 37.6173, "population": 12.5, "region": "EU", "avg_temp": 5.8, "humidity": 76},
    {"id": "dxb", "name": "Dubai", "country": "UAE", "lat": 25.2048, "lng": 55.2708, "population": 3.3, "region": "AS", "avg_temp": 26.9, "humidity": 60},
    {"id": "tok", "name": "Tokyo", "country": "Japan", "lat": 35.6762, "lng": 139.6503, "population": 13.9, "region": "AS", "avg_temp": 15.4, "humidity": 63},
    {"id": "pek", "name": "Beijing", "country": "China", "lat": 39.9042, "lng": 116.4074, "population": 21.5, "region": "AS", "avg_temp": 12.9, "humidity": 54},
    {"id": "sin", "name": "Singapore", "country": "Singapore", "lat": 1.3521, "lng": 103.8198, "population": 5.7, "region": "AS", "avg_temp": 27.0, "humidity": 84},
    {"id": "mum", "name": "Mumbai", "country": "India", "lat": 19.076, "lng": 72.8777, "population": 20.4, "region": "AS", "avg_temp": 27.2, "humidity": 72},
    {"id": "del", "name": "Delhi", "country": "India", "lat": 28.7041, "lng": 77.1025, "population": 30.3, "region": "AS", "avg_temp": 23.6, "humidity": 56},
    {"id": "shl", "name": "Shanghai", "country": "China", "lat": 31.2304, "lng": 121.4737, "population": 24.9, "region": "AS", "avg_temp": 15.8, "humidity": 70},
    {"id": "syd", "name": "Sydney", "country": "Australia", "lat": -33.8688, "lng": 151.2093, "population": 5.3, "region": "OC", "avg_temp": 17.6, "humidity": 66},
    {"id": "sao", "name": "São Paulo", "country": "Brazil", "lat": -23.5505, "lng": -46.6333, "population": 12.3, "region": "SA", "avg_temp": 20.0, "humidity": 76},
    {"id": "mxo", "name": "Mexico City", "country": "Mexico", "lat": 19.4326, "lng": -99.1332, "population": 9.2, "region": "NA", "avg_temp": 16.5, "humidity": 55},
    {"id": "lag", "name": "Lagos", "country": "Nigeria", "lat": 6.5244, "lng": 3.3792, "population": 15.4, "region": "AF", "avg_temp": 27.0, "humidity": 75},
    {"id": "cai", "name": "Cairo", "country": "Egypt", "lat": 30.0444, "lng": 31.2357, "population": 10.1, "region": "AF", "avg_temp": 21.4, "humidity": 56},
    {"id": "ban", "name": "Bangkok", "country": "Thailand", "lat": 13.7563, "lng": 100.5018, "population": 10.5, "region": "AS", "avg_temp": 28.6, "humidity": 72},
    {"id": "ist", "name": "Istanbul", "country": "Turkey", "lat": 41.0082, "lng": 28.9784, "population": 15.5, "region": "EU", "avg_temp": 14.2, "humidity": 72},
    {"id": "seo", "name": "Seoul", "country": "South Korea", "lat": 37.5665, "lng": 126.978, "population": 9.7, "region": "AS", "avg_temp": 12.5, "humidity": 65},
    {"id": "tor", "name": "Toronto", "country": "Canada", "lat": 43.6532, "lng": -79.3832, "population": 2.7, "region": "NA", "avg_temp": 9.4, "humidity": 70},
    {"id": "bue", "name": "Buenos Aires", "country": "Argentina", "lat": -34.6037, "lng": -58.3816, "population": 3.1, "region": "SA", "avg_temp": 17.7, "humidity": 70},
    {"id": "jak", "name": "Jakarta", "country": "Indonesia", "lat": -6.2088, "lng": 106.8456, "population": 10.6, "region": "AS", "avg_temp": 27.3, "humidity": 80},
    {"id": "nbo", "name": "Nairobi", "country": "Kenya", "lat": -1.2921, "lng": 36.8219, "population": 4.7, "region": "AF", "avg_temp": 18.3, "humidity": 68},
]

CITY_MAP = {c["id"]: c for c in CITIES}

# Flight route data (weekly passenger flows in thousands)
FLIGHT_ROUTES = [
    # North America
    ("nyc", "lax", 520), ("nyc", "chi", 380), ("lax", "chi", 290),
    ("nyc", "tor", 180), ("lax", "tor", 120),
    # NA-Europe
    ("nyc", "lon", 350), ("nyc", "par", 200), ("nyc", "ber", 90),
    ("lax", "lon", 160), ("nyc", "mos", 60),
    # NA-South America
    ("nyc", "sao", 140), ("nyc", "mxo", 200), ("lax", "mxo", 150),
    ("nyc", "bue", 60),
    # Europe internal
    ("lon", "par", 310), ("lon", "ber", 180), ("par", "ber", 150),
    ("lon", "ist", 120), ("par", "ist", 100), ("ber", "mos", 80),
    ("lon", "mos", 100),
    # Europe-Asia
    ("lon", "dxb", 280), ("par", "dxb", 160), ("lon", "tok", 130),
    ("lon", "pek", 110), ("ber", "tok", 70), ("ist", "dxb", 200),
    # Middle East hub
    ("dxb", "sin", 180), ("dxb", "mum", 220), ("dxb", "pek", 140),
    ("dxb", "cai", 100), ("dxb", "lag", 70), ("dxb", "tok", 100),
    ("dxb", "jak", 110),
    # Asia internal
    ("tok", "pek", 200), ("tok", "seo", 260), ("tok", "sin", 140),
    ("pek", "shl", 400), ("pek", "mum", 100), ("pek", "ban", 130),
    ("shl", "tok", 120), ("sin", "ban", 150), ("sin", "jak", 170),
    ("sin", "mum", 130), ("mum", "ban", 80), ("seo", "pek", 90),
    ("seo", "sin", 70),
    # Asia-Oceania
    ("tok", "syd", 100), ("sin", "syd", 120),
    # South America internal
    ("sao", "bue", 90), ("sao", "mxo", 60),
    # Africa
    ("lag", "cai", 50), ("lag", "lon", 100), ("nbo", "dxb", 80),
    ("cai", "ist", 90), ("nbo", "lag", 40),
    # Cross-continental
    ("lax", "tok", 110), ("lax", "syd", 90), ("nyc", "sin", 70),
    ("lax", "seo", 80),
]


def build_transport_graph() -> nx.Graph:
    """Build NetworkX graph from city and route data."""
    G = nx.Graph()

    for city in CITIES:
        G.add_node(
            city["id"],
            name=city["name"],
            country=city["country"],
            lat=city["lat"],
            lng=city["lng"],
            population=city["population"],
            region=city["region"],
            avg_temp=city["avg_temp"],
            humidity=city["humidity"],
        )

    for from_id, to_id, weekly_pax in FLIGHT_ROUTES:
        if from_id in CITY_MAP and to_id in CITY_MAP:
            G.add_edge(from_id, to_id, weekly_pax=weekly_pax)

    return G


def compute_mobility_flows(
    day_states: Dict[str, Dict[str, float]],
    params: Dict,
) -> Dict[str, Dict[str, float]]:
    """Compute inter-city mobility flows for pathogen spread."""
    G = build_transport_graph()
    flows = {node: {"in_flow": 0.0, "out_flow": 0.0} for node in G.nodes()}

    mobility_factor = max(0.05, 1 - params.get("mobility_reduction", 0))

    for from_id, to_id, data in G.edges(data=True):
        from_city = CITY_MAP[from_id]
        to_city = CITY_MAP[to_id]
        from_seir = day_states.get(from_id, {})
        to_seir = day_states.get(to_id, {})

        if not from_seir or not to_seir:
            continue

        daily_pax = data["weekly_pax"] / 7 / 1000  # millions per day

        # Border restrictions
        border_factor = 1.0
        if params.get("border_restrictions"):
            border_factor = 0.2 if from_city["region"] != to_city["region"] else 0.8
        if params.get("flight_ban"):
            border_factor *= 0.15

        total_travelers = daily_pax * mobility_factor * border_factor

        # Proportional compartment flows
        from_pop = from_city["population"]
        to_pop = to_city["population"]

        flow_to_dest = total_travelers * (from_seir.get("S", 0) + from_seir.get("E", 0) + from_seir.get("I", 0) + from_seir.get("R", 0)) / from_pop
        flow_to_source = total_travelers * (to_seir.get("S", 0) + to_seir.get("E", 0) + to_seir.get("I", 0) + to_seir.get("R", 0)) / to_pop

        flows[to_id]["in_flow"] += flow_to_dest
        flows[from_id]["out_flow"] += flow_to_dest
        flows[from_id]["in_flow"] += flow_to_source
        flows[to_id]["out_flow"] += flow_to_source

    return flows


def run_multi_node_simulation(params: Dict) -> Dict:
    """Run full multi-node SEIR simulation with mobility coupling."""
    sim_days = params["simulation_days"]
    base_beta = compute_beta_from_r0(params["r0"], params["gamma"], params["mu"])

    # Initialize states
    current_states = {}
    for city in CITIES:
        if city["id"] == params["patient_zero_id"]:
            current_states[city["id"]] = {
                "S": city["population"] - params["initial_infections"],
                "E": params["initial_infections"] * 0.3,
                "I": params["initial_infections"] * 0.5,
                "R": params["initial_infections"] * 0.1,
                "D": params["initial_infections"] * 0.1,
            }
        else:
            current_states[city["id"]] = {
                "S": city["population"] - 0.001,
                "E": 0,
                "I": 0.0005,
                "R": 0.0005,
                "D": 0,
            }

    city_data = {}
    global_summary = {}

    for day in range(sim_days + 1):
        # Store day state
        city_data[day] = []
        for city in CITIES:
            seir = current_states[city["id"]]
            city_data[day].append({
                "city_id": city["id"],
                "city_name": city["name"],
                "seir": seir,
                "population": city["population"],
                "infection_rate": seir["I"] / city["population"],
                "prevalence": (seir["I"] + seir["E"]) / city["population"],
                "cumulative_deaths": seir["D"],
            })

        # Global summary
        gs = {"S": 0, "E": 0, "I": 0, "R": 0, "D": 0}
        for seir in current_states.values():
            for key in gs:
                gs[key] += seir[key]
        global_summary[day] = gs

        if day >= sim_days:
            break

        # Compute mobility flows
        flows = compute_mobility_flows(current_states, params)

        # Evolve each city
        next_states = {}
        for city in CITIES:
            flow = flows[city["id"]]
            mob_flows = [(day, flow["in_flow"])]

            city_params = {**params, "beta": base_beta}
            trajectory = solve_seir(
                city["population"],
                current_states[city["id"]],
                city_params,
                1,
                city["avg_temp"],
                city["humidity"],
                mob_flows,
            )

            next_state = {**trajectory[1]}

            # Subtract outflow
            total_compartments = current_states[city["id"]]["S"] + current_states[city["id"]]["E"] + current_states[city["id"]]["I"] + current_states[city["id"]]["R"]
            if total_compartments > 0:
                for key in ["S", "E", "I", "R"]:
                    next_state[key] -= flow["out_flow"] * current_states[city["id"]][key] / total_compartments

            # Clamp and renormalize
            total = sum(next_state.values())
            if abs(total - city["population"]) > 1e-10:
                scale = city["population"] / total if total > 0 else 1
                for key in next_state:
                    next_state[key] = max(0, next_state[key] * scale)

            next_states[city["id"]] = next_state

        current_states = next_states

    # Verification
    verification = verify_population_conservation(
        [global_summary[d] for d in range(0, sim_days + 1, 10)],
        sum(c["population"] for c in CITIES),
        tolerance=1.0,
    )

    return {
        "days": list(range(sim_days + 1)),
        "city_data": city_data,
        "global_summary": global_summary,
        "verification": verification,
    }

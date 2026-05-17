if config["predicate"] == () || run_rhai(config["predicate"], payload) == true {
  payload
} else {
  #{
    status: "complete",
    payload: payload,
    diagnostics: ["filter rejected payload"]
  }
}

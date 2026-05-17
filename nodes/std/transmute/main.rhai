if config["script"] == () {
  payload
} else {
  run_rhai(config["script"], payload)
}

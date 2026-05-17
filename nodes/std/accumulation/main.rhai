if config["locked"] == true {
  #{
    status: "wait",
    payload: payload,
    wait: #{
      reason: "queue locked"
    },
    diagnostics: ["accumulation queue is locked"]
  }
} else {
  payload
}

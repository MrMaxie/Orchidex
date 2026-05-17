if config["locked"] == true && payload["queueReleased"] != true {
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

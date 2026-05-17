if payload["manualAccepted"] == true {
  payload
} else {
  #{
    status: "wait",
    payload: payload,
    wait: #{
      reason: "manual acceptance required"
    },
    diagnostics: [config["prompt"]]
  }
}

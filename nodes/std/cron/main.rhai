#{
  status: "wait",
  payload: payload,
  wait: #{
    reason: config["schedule"]
  },
  diagnostics: ["cron schedule armed"]
}

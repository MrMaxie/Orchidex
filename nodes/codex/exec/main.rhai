let fixture_path = if config["fixture"] == () { () } else { config["fixture"] };

if fixture_path == () {
  #{
    status: "fail",
    payload: payload,
    diagnostics: ["codex fixture path is required when recording is disabled"]
  }
} else {
  let fixture = codex_fixture(fixture_path);
  #{
    payload: #{
      input: payload,
      response: fixture["response"],
      fixture: fixture_path,
      model: fixture["model"],
      effort: fixture["effort"],
      recording: fixture["recording"]
    },
    diagnostics: ["fixture-first codex execution"]
  }
}

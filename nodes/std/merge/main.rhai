let strategy = if config["strategy"] == () { "latest" } else { config["strategy"] };

if strategy == "array" {
  [payload]
} else if strategy == "object" && payload["items"] != () {
  let merged = #{};
  for item in payload["items"] {
    for key in item.keys() {
      merged[key] = item[key];
    }
  }
  merged
} else {
  payload
}

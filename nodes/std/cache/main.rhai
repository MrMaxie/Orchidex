let key = if config["key"] == () { "default" } else { config["key"] };
let cached = cache_get(key);

if cached == () {
  cache_set(key, payload)
} else {
  cached
}

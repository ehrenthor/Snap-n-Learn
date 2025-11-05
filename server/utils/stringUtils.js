const extractStringFromXMLTags = (str, tag) => {
  const match = str.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'));
  if (!match || match.length < 2) {
    console.error(`Validation Error: Could not find <${tag}> tags or content within them.`);
    return null;
  }
  return match[1];
}

module.exports = {
  extractStringFromXMLTags
}
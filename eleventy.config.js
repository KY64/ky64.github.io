import CleanCSS from "clean-css";
import markdownIt from "markdown-it";

export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.addFilter("cssmin", (code) =>
    new CleanCSS({level: 2}).minify(code).styles);
  eleventyConfig.addPassthroughCopy("src/css/mobile.css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addNunjucksFilter(
    "date",
    (date) => new Date(date).toISOString().split("T")[0],
  );

  const md = markdownIt();
  const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener");
    return defaultRender(tokens, idx, options, env, self);
  };

  eleventyConfig.setLibrary("md", md);
}

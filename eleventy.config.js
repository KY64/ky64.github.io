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

  const md = markdownIt({ html: true, linkify: true, typographer: true });
  const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener");
    return defaultRender(tokens, idx, options, env, self);
  };

  const slug = (text) => text.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g, "");
  const defaultHeading = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
    const title = tokens[idx + 1].children.reduce((acc, t) => acc + t.content, "");
    const id = slug(title);
    tokens[idx].attrSet("id", id);
    return `${defaultHeading(tokens, idx, options, env, self)}<a href="#${id}">`;
  };

  md.renderer.rules.heading_close = function(tokens, idx, options, env, self) {
    const tag = tokens[idx].tag;
    const defaultClose = self.renderToken(tokens, idx, options);
    return `</a>${defaultClose}`;
  };

  eleventyConfig.setLibrary("md", md);
}

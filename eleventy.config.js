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

  // Markdown tables can be wider than the reading column (especially the
  // embedding matrices in technical posts). Keep the document responsive by
  // giving each table its own horizontal scroll container.
  const defaultTableOpen = md.renderer.rules.table_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  const defaultTableClose = md.renderer.rules.table_close || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.table_open = function(tokens, idx, options, env, self) {
    return `<div class="table-scroll" tabindex="0" aria-label="Scrollable table">${defaultTableOpen(tokens, idx, options, env, self)}`;
  };
  md.renderer.rules.table_close = function(tokens, idx, options, env, self) {
    return `${defaultTableClose(tokens, idx, options, env, self)}</div>`;
  };

  eleventyConfig.setLibrary("md", md);
}

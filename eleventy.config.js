import CleanCSS from "clean-css";

export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.addFilter("cssmin", (code) => 
    new CleanCSS({level: 2}).minify(code).styles);
  eleventyConfig.addPassthroughCopy("src/css/mobile.css");
  eleventyConfig.addNunjucksFilter(
    "date",
    (date) => new Date(date).toISOString().split("T")[0],
  );
}

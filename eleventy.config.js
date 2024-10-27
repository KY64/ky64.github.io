export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.addPassthroughCopy("src/css/style.css");
  eleventyConfig.addPassthroughCopy("src/css/mobile.css");
  eleventyConfig.addNunjucksFilter(
    "date",
    (date) => new Date(date).toISOString().split("T")[0],
  );
}

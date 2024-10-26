export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addNunjucksFilter(
    "date",
    (date) => new Date(date).toISOString().split("T")[0],
  );
}

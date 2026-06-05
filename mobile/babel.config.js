module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            // Try this if "react-native-worklets/plugin" doesn't work
            require.resolve("react-native-worklets-core/plugin"),
        ],
    };
};
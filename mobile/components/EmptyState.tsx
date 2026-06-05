import React from 'react';
import { WebView } from 'react-native-webview';

function generateEmptyHtml(message: string) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #f8fafc;
            color: #64748b;
            margin: 0;
        }
        .message {
            text-align: center;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class=\"message\">${message}</div>
</body>
</html>`;
}

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <WebView
    source={{ html: generateEmptyHtml(message) }}
    originWhitelist={["*"]}
    style={{ flex: 1, width: '100%', height: '100%' }}
    javaScriptEnabled={true}
    scalesPageToFit={false}
    startInLoadingState={true}
  />
);

export default EmptyState;

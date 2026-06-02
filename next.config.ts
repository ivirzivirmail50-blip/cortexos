import type { NextConfig } from 'next';
import webpack from 'webpack';

const nextConfig: NextConfig = {
  transpilePackages: ['@cortexos/ai-core', '@cortexos/db', '@cortexos/utils', '@cortexos/knowledge-base'],
  
  serverExternalPackages: [
    'pg', 
    'drizzle-orm', 
    'chromadb', 
    'chromadb-default-embed',
    'onnxruntime-node',
  ],

  webpack: (config, { isServer }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^https:\/\/unpkg\.com\/chromadb-default-embed.*/,
        'chromadb-default-embed'
      )
    );

    // ✅ .node binary dosyalarını webpack'in parse etmesini engelle
    config.module.rules.push({
      test: /\.node$/,
      use: [{ loader: 'ignore-loader' }],
    });

    // ✅ onnxruntime-node'u ve .node dosyalarını externals olarak işaretle
    const originalExternals = config.externals;
    config.externals = [
      ...(Array.isArray(originalExternals) ? originalExternals : originalExternals ? [originalExternals] : []),
      'onnxruntime-node',
      ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
        if (request?.endsWith('.node')) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      },
    ];

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
        'chromadb-default-embed': false,
      };
    }

    return config;
  },
};

export default nextConfig;
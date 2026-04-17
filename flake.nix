{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShellNoCC {
          env.PLAYWRIGHT_BROWSERS_PATH = "0";
          packages = with pkgs; [
            nodejs-slim_24
            pnpm

            typescript-language-server
            svelte-language-server
            # vscode-css-languageserver
            vscode-json-languageserver
            nil
          ];
        };
      }
    );
}

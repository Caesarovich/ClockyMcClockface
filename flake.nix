{
  description = "Development environment for project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:

	let
    system = "x86_64-linux";
  in
	{
    devShells.${system}.default = nixpkgs.mkShell {
			packages = [
				nixpkgs.bun
				nixpkgs.ffmpeg
				nixpkgs.git
			];
		};
	};
}
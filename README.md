# normun
Electron-based, cross-platform utility application for working with Normal Maps.

- Channel remapping
- Derive implied vector component from 1-3 given components.
- Invert vector Y component to switch between DX and OpenGL
- DDS/TGA input formats, TGA output format

Default remap settings are for converting X=A, Y=G maps to X=R, Y=G, Z=B. Default normalize setting is for reconstructing Z=B channel information using X=R, Y=G.

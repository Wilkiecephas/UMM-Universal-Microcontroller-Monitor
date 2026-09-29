@echo off
echo Compiling main.tex with Tectonic...
tectonic.exe main.tex
if %ERRORLEVEL% equ 0 (
    echo Successfully compiled main.pdf!
) else (
    echo Compilation failed.
)

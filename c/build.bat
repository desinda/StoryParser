@echo off
cl /W4 /std:c11 /Zi /nologo src/sdc_parser.c test/test.c /Fe:test_parser.exe
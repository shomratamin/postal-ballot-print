[Setup]
AppName=BPO Cloud Print Client
AppVersion=1.0
DefaultDirName={pf64}\BPOCloudPrintClient
DefaultGroupName=BPO Cloud Print Client
OutputBaseFilename=BPOCloudPrintClientInstaller
Compression=lzma
SolidCompression=yes
SetupIconFile=app_icon.ico
DisableProgramGroupPage=yes

[Files]
Source: "main.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "evnts.bin"; DestDir: "{app}\data"; Flags: ignoreversion onlyifdoesntexist
Source: "bin\gsdll64.dll"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "bin\gswin64c.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "app_settings.json"; DestDir: "{app}\data"; Flags: ignoreversion onlyifdoesntexist
Source: "fonts\kalpurush.ttf"; DestDir: "{app}\fonts"; Flags: ignoreversion
Source: "fonts\RobotoMono-VariableFont_wght.ttf"; DestDir: "{app}\fonts"; Flags: ignoreversion
Source: "bpo.svg"; DestDir: "{app}"; Flags: ignoreversion
Source: "app_icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\BPO Cloud Print Client"; Filename: "{app}\main.exe"; WorkingDir: "{app}"; IconFilename: "{app}\app_icon.ico"
Name: "{commondesktop}\BPO Cloud Print Client"; Filename: "{app}\main.exe"; WorkingDir: "{app}"; IconFilename: "{app}\app_icon.ico"

[Run]
Filename: "{app}\main.exe"; Description: "Launch BPO Cloud Print Client"; Flags: nowait postinstall skipifsilent

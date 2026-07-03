unit UnleashClient;

{
  Cliente mínimo para a Frontend API do Unleash, para uso em módulos desktop Delphi.
  Não existe SDK oficial para Delphi, então falamos HTTP diretamente com a Frontend API
  (a mesma API usada pelo SDK de React), usando um token de FRONTEND — nunca um token
  de backend, já que o executável pode ser distribuído/decompilado pelos usuários finais.

  Endpoint: GET {UnleashUrl}/api/frontend
  Header:   Authorization: <frontend-token>
  Resposta: { "toggles": [ { "name": "...", "enabled": true, "variant": {...} }, ... ] }
}

interface

uses
  System.SysUtils, System.Net.HttpClient, System.JSON, System.Generics.Collections;

type
  TUnleashClient = class
  private
    FBaseUrl: string;   // ex.: http://localhost:4242
    FToken: string;     // token de FRONTEND criado na Admin UI
    FToggles: TDictionary<string, Boolean>;
    procedure Refresh;
  public
    constructor Create(const ABaseUrl, AFrontendToken: string);
    destructor Destroy; override;
    function IsEnabled(const AFeatureName: string; ADefault: Boolean = False): Boolean;
  end;

implementation

constructor TUnleashClient.Create(const ABaseUrl, AFrontendToken: string);
begin
  inherited Create;
  FBaseUrl := ABaseUrl;
  FToken := AFrontendToken;
  FToggles := TDictionary<string, Boolean>.Create;
  Refresh;
end;

destructor TUnleashClient.Destroy;
begin
  FToggles.Free;
  inherited;
end;

procedure TUnleashClient.Refresh;
var
  Http: THTTPClient;
  Resp: IHTTPResponse;
  Json: TJSONObject;
  Toggles: TJSONArray;
  Item: TJSONValue;
  Name: string;
  Enabled: Boolean;
begin
  Http := THTTPClient.Create;
  try
    try
      Http.CustomHeaders['Authorization'] := FToken;
      Resp := Http.Get(FBaseUrl + '/api/frontend');
    except
      Exit; // servidor indisponível: mantém o cache anterior (ou vazio)
    end;
    if Resp.StatusCode <> 200 then
      Exit;

    Json := TJSONObject.ParseJSONValue(Resp.ContentAsString) as TJSONObject;
    try
      if not Assigned(Json) then
        Exit;
      Toggles := Json.GetValue<TJSONArray>('toggles');
      FToggles.Clear;
      for Item in Toggles do
      begin
        Name := TJSONObject(Item).GetValue<string>('name');
        Enabled := TJSONObject(Item).GetValue<Boolean>('enabled');
        FToggles.AddOrSetValue(Name, Enabled);
      end;
    finally
      Json.Free;
    end;
  finally
    Http.Free;
  end;
end;

function TUnleashClient.IsEnabled(const AFeatureName: string; ADefault: Boolean): Boolean;
begin
  if not FToggles.TryGetValue(AFeatureName, Result) then
    Result := ADefault;
end;

end.

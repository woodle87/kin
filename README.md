# Cannon Car Simulator

Simulador off-road em navegador usando **Three.js** (renderização 3D) e **cannon-es** (física veicular).

O projeto traz múltiplos veículos, zonas de teste (rampa, saltos, lombadas, pedras e obstáculos dinâmicos), HUD de telemetria e diferentes modos de câmera.

## Demonstração

Abra localmente e rode em um servidor HTTP (não funciona corretamente via `file://` por causa de módulos ES e carregamento de assets).

## Tecnologias

- HTML5 + CSS3 + JavaScript (ES Modules)
- [Three.js](https://threejs.org/)
- [cannon-es](https://github.com/pmndrs/cannon-es)
- GLTF/GLB para modelos 3D

## Funcionalidades

- Física de veículo com `RaycastVehicle`
- Seleção de carro em tempo real via HUD
- 11 modelos de veículos (`.glb`)
- 4 modos de câmera:
  - `CHASE`
  - `HOOD`
  - `TOP`
  - `ORBIT`
- Telemetria em tempo real:
  - Velocidade
  - Marcha
  - Carga de suspensão
  - Estabilidade
  - Tempo de sessão
  - Zona de teste atual
- Teleporte entre zonas de teste
- Reset rápido do veículo

## Controles

- `W / S / A / D`: dirigir
- `SPACE`: freio de mão
- `SHIFT`: boost
- `C`: trocar câmera
- `R`: resetar veículo
- `T`: teletransportar entre zonas

## Como executar localmente

### 1) Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd Cannon-Car-Simulator
```

### 2) Inicie um servidor local

Opção com Python:

```bash
python3 -m http.server 8080
```

### 3) Abra no navegador

```text
http://localhost:8080
```

## Estrutura do projeto

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js       # bootstrap, loop de animação e câmeras
│   ├── physics.js    # configuração do mundo físico
│   ├── terrain.js    # geração do cenário e zonas de teste
│   ├── vehicle.js    # lógica do carro, rodas e modelos GLB
│   ├── ui.js         # atualização do HUD
│   └── utils.js      # input de teclado e utilitários
└── assets/
    ├── models/       # veículos .glb
    └── textures/     # texturas do terreno
```

## Zonas de teste

- `MAIN TRACK`
- `BUMPS TEST`
- `SLOPE TEST`
- `ROCKY AREA`
- `JUMP ZONE`
- `OBSTACLES`

## Customização rápida

- Ajuste parâmetros de cada veículo em `js/vehicle.js` no objeto `carConfigs` (massa, força, freio, esterço e posição das rodas).
- Ajuste física global em `js/physics.js` (gravidade, atrito e solver).
- Ajuste obstáculos e geometrias do circuito em `js/terrain.js`.

## Licença

Este projeto está licenciado sob a Licença MIT. Leia o arquivo para mais detalhes.
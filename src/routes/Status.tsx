import { Card, ProgressBar, Row, Col, Badge } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import CardHeader from "../components/CardHeader";
import { LaserState, AlarmState, LidState, FlameSensorStatus, UartStatus } from "../types/Stores";
import { ReactElement, useMemo } from 'react';

const Status = observer(() => {
  const { laserStore, lidsStore, coolingStore, systemStore, serialStore, settingsStore } = useStore();

  const gridStyle = {
    gridAutoRows: '1fr'
  };

  const progressBarContainerStyle = {
    height: '2rem',
    fontSize: '1rem',
    position: 'relative' as const,
  };

  const progressLabelStyle = {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    zIndex: 1,
    fontSize: '.9em',
  };

  const getProgressBarStyle = (variant: string) => ({
    height: '100%',
    backgroundColor: (variant === 'danger' ? 'var(--bs-danger-bg-subtle)' : 'var(--bs-progress-bg)'),
  });

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    margin: 0,
  };

  const getStatusBadge = (state: string, warningStates: string[], okStates: string[]): ReactElement|null => {
    if (okStates.includes(state)) {
      return <Badge bg="success">OK</Badge>;
    }
    if (warningStates.includes(state)) {
      return <Badge bg="warning">Warning</Badge>;
    }
    return <Badge bg="danger">Problem</Badge>;
  };

  const getLaserStateBadge = (state: LaserState): ReactElement|null => {
    return getStatusBadge(
      state,
      [
        LaserState.Hold,
        LaserState.HoldComplete,
        LaserState.Door,
        LaserState.DoorHold,
        LaserState.DoorResume,
        LaserState.DoorRestart,
        LaserState.Check,
        LaserState.Run,
        LaserState.Unknown
      ],
      [LaserState.Idle, LaserState.Jog]
    );
  };

  const getAlarmStateBadge = (state: AlarmState): ReactElement|null => {
    return getStatusBadge(
      state,
      [AlarmState.Unknown],
      [AlarmState.NoAlarm]
    );
  };

  const getLidStateBadge = (state: LidState): ReactElement|null => {
    return getStatusBadge(
      state,
      [LidState.Unknown],
      [LidState.Closed]
    );
  };

  const getFlameSensorBadge = (state: FlameSensorStatus): ReactElement|null => {
    return getStatusBadge(
      state,
      [FlameSensorStatus.Unknown],
      [FlameSensorStatus.OK]
    );
  };

  const getInterlockBadge = (enabled: boolean | undefined): ReactElement|null => {
    if (!enabled) {
      return <Badge bg="warning">Warning</Badge>;
    }
    return  <Badge bg="success">Ok</Badge>;
  };

  const getUartStatusBadge = (state: UartStatus): ReactElement|null => {
    return getStatusBadge(
      state,
      [UartStatus.Unknown],
      [UartStatus.Connected]
    );
  };

  const getSerialConnectionBadge = (state: UartStatus): ReactElement|null => {
    return getStatusBadge(
      state,
      [UartStatus.Unknown],
      [UartStatus.Connected]
    );
  };

  const isWithinBounds = (value: number | undefined, min: number | undefined, max: number | undefined) => {
    if (value === undefined) return false;
    if (min === undefined || value < min) return false;
    if (max === undefined || value > max) return false;
    return true;
  };

  const isPanelOk = {
    fluidnc: (currentState: LaserState, currentAlarm: AlarmState): boolean => {
      return (currentState === LaserState.Idle || currentState === LaserState.Jog || currentState === LaserState.Run) &&
             currentAlarm === AlarmState.NoAlarm;
    },

    lids: (frontLidState: LidState, backLidState: LidState): boolean => {
      return frontLidState === LidState.Closed &&
             backLidState === LidState.Closed;
    },

    cooling: (
      inputFlow: number | undefined,
      outputFlow: number | undefined,
      inputTemperature: number | undefined,
      outputTemperature: number | undefined
    ): boolean => {
      const { probes } = settingsStore;
      return isWithinBounds(inputFlow, probes.cooling?.flow?.min, probes.cooling?.flow?.max) &&
             isWithinBounds(outputFlow, probes.cooling?.flow?.min, probes.cooling?.flow?.max) &&
             isWithinBounds(inputTemperature, probes.cooling?.temp?.min, probes.cooling?.temp?.max) &&
             isWithinBounds(outputTemperature, probes.cooling?.temp?.min, probes.cooling?.temp?.max);
    },

    misc: (
      flameSensorStatus: FlameSensorStatus,
      uartStatus: UartStatus,
      connectionState: UartStatus
    ): boolean => {
      return flameSensorStatus === FlameSensorStatus.OK &&
             uartStatus === UartStatus.Connected &&
             connectionState === UartStatus.Connected;
    }
  };

  const getStatusProps = (isOk: boolean) => ({
    text: isOk ? "OK" : "Issue detected",
    variant: isOk ? "success" : "danger"
  } as const);

  const getProgressBarRange = (min: number | undefined, max: number | undefined, defaultMin: number, defaultMax: number) => {
    const actualMin = min ?? defaultMin;
    const actualMax = max ?? defaultMax;
    const range = actualMax - actualMin;
    return {
      min: actualMin - (range * 0.25),
      max: actualMax + (range * 0.25)
    };
  };

  const progressBarVariants = useMemo(() => ({
    inputFlow: isWithinBounds(
      coolingStore.inputFlow,
      settingsStore.probes.cooling?.flow?.min,
      settingsStore.probes.cooling?.flow?.max
    ) ? 'primary' : 'danger',
    inputTemp: isWithinBounds(
      coolingStore.inputTemperature,
      settingsStore.probes.cooling?.temp?.min,
      settingsStore.probes.cooling?.temp?.max
    ) ? 'primary' : 'danger',
    outputFlow: isWithinBounds(
      coolingStore.outputFlow,
      settingsStore.probes.cooling?.flow?.min,
      settingsStore.probes.cooling?.flow?.max
    ) ? 'primary' : 'danger',
    outputTemp: isWithinBounds(
      coolingStore.outputTemperature,
      settingsStore.probes.cooling?.temp?.min,
      settingsStore.probes.cooling?.temp?.max
    ) ? 'primary' : 'danger',
  }), [
    coolingStore.inputFlow,
    coolingStore.inputTemperature,
    coolingStore.outputFlow,
    coolingStore.outputTemperature,
    settingsStore.probes.cooling?.flow?.min,
    settingsStore.probes.cooling?.flow?.max,
    settingsStore.probes.cooling?.temp?.min,
    settingsStore.probes.cooling?.temp?.max,
  ]);

  const flowRange = useMemo(() => getProgressBarRange(
    settingsStore.probes.cooling?.flow?.min,
    settingsStore.probes.cooling?.flow?.max,
    0,
    20
  ), [
    settingsStore.probes.cooling?.flow?.min,
    settingsStore.probes.cooling?.flow?.max
  ]);

  const tempRange = useMemo(() => getProgressBarRange(
    settingsStore.probes.cooling?.temp?.min,
    settingsStore.probes.cooling?.temp?.max,
    0,
    100
  ), [
    settingsStore.probes.cooling?.temp?.min,
    settingsStore.probes.cooling?.temp?.max
  ]);

  return (
    <div className="flex-grow-1 grid m-4 mt-0" style={gridStyle}>
      <Card className="border-primary g-col-6">
        <CardHeader
          icon="bi-cpu"
          title="FluidNC"
          status={getStatusProps(isPanelOk.fluidnc(laserStore.currentState, laserStore.currentAlarm))}
        />
        <Card.Body>
          <p className="d-flex align-items-baseline gap-1">
            <strong className="text-nowrap">Current State:</strong>
            <span className="flex-grow-1 fw-light">{laserStore.currentState}</span>
            {getLaserStateBadge(laserStore.currentState)}
          </p>
          <p className="d-flex align-items-baseline gap-1">
            <strong className="text-nowrap">Alarm State:</strong>
            <span className="flex-grow-1 fw-light">{laserStore.currentAlarm}</span>
            {getAlarmStateBadge(laserStore.currentAlarm)}
          </p>
        </Card.Body>
      </Card>
      <Card className="border-primary g-col-6">
        <CardHeader
          icon="bi-door-open"
          title="Lids"
          status={getStatusProps(isPanelOk.lids(lidsStore.frontLidState, lidsStore.backLidState))}
        />
        <Card.Body>
          <p className="d-flex align-items-baseline gap-1">
            <strong className="text-nowrap">Front Lid:</strong>
            <span className="flex-grow-1 fw-light">{lidsStore.frontLidState}</span>
            {getLidStateBadge(lidsStore.frontLidState)}
          </p>
          <p className="d-flex align-items-baseline gap-1">
            <strong className="text-nowrap">Back Lid:</strong>
            <span className="flex-grow-1 fw-light">{lidsStore.backLidState}</span>
            {getLidStateBadge(lidsStore.backLidState)}
          </p>
        </Card.Body>
      </Card>
      <Card className="border-primary g-col-6">
        <CardHeader
          icon="bi-thermometer-half"
          title="Cooling"
          status={getStatusProps(isPanelOk.cooling(coolingStore.inputFlow, coolingStore.outputFlow, coolingStore.inputTemperature, coolingStore.outputTemperature))}
        />
        <Card.Body>
          <Row className="mb-3 align-items-center">
            <Col xs={4} style={labelStyle}><strong>Input Flow:</strong></Col>
            <Col xs={8}>
              <div style={progressBarContainerStyle}>
                <div style={progressLabelStyle}>
                  {coolingStore.inputFlow !== undefined ? `${coolingStore.inputFlow.toFixed(1)} L/min` : 'Unknown'}
                </div>
                <ProgressBar
                  style={getProgressBarStyle(progressBarVariants.inputFlow)}
                  min={flowRange.min}
                  max={flowRange.max}
                  now={coolingStore.inputFlow}
                  variant={progressBarVariants.inputFlow}
                />
              </div>
            </Col>
          </Row>
          <Row className="mb-3 align-items-center">
            <Col xs={4} style={labelStyle}><strong>Input Temp.:</strong></Col>
            <Col xs={8}>
              <div style={progressBarContainerStyle}>
                <div style={progressLabelStyle}>
                  {coolingStore.inputTemperature !== undefined ? `${coolingStore.inputTemperature.toFixed(1)}°C` : 'Unknown'}
                </div>
                <ProgressBar
                  style={getProgressBarStyle(progressBarVariants.inputTemp)}
                  min={tempRange.min}
                  max={tempRange.max}
                  now={coolingStore.inputTemperature}
                  variant={progressBarVariants.inputTemp}
                />
              </div>
            </Col>
          </Row>
          <Row className="mb-3 align-items-center">
            <Col xs={4} style={labelStyle}><strong>Output Flow:</strong></Col>
            <Col xs={8}>
              <div style={progressBarContainerStyle}>
                <div style={progressLabelStyle}>
                  {coolingStore.outputFlow !== undefined ? `${coolingStore.outputFlow.toFixed(1)} L/min` : 'Unknown'}
                </div>
                <ProgressBar
                  style={getProgressBarStyle(progressBarVariants.outputFlow)}
                  min={flowRange.min}
                  max={flowRange.max}
                  now={coolingStore.outputFlow}
                  variant={progressBarVariants.outputFlow}
                />
              </div>
            </Col>
          </Row>
          <Row className="align-items-center">
            <Col xs={4} style={labelStyle}><strong>Output Temp.:</strong></Col>
            <Col xs={8}>
              <div style={progressBarContainerStyle}>
                <div style={progressLabelStyle}>
                  {coolingStore.outputTemperature !== undefined ? `${coolingStore.outputTemperature.toFixed(1)}°C` : 'Unknown'}
                </div>
                <ProgressBar
                  style={getProgressBarStyle(progressBarVariants.outputTemp)}
                  min={tempRange.min}
                  max={tempRange.max}
                  now={coolingStore.outputTemperature}
                  variant={progressBarVariants.outputTemp}
                />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card className="border-primary g-col-6">
        <CardHeader
          icon="bi-gear"
          title="Misc."
          status={getStatusProps(isPanelOk.misc(systemStore.flameSensorStatus, systemStore.uartStatus, serialStore.connectionState))}
        />
        <Card.Body>
          <p className="d-flex align-items-baseline gap-1">
            <strong className="text-nowrap">Flame Sensor Status:</strong>
            <span className="flex-grow-1 fw-light">{systemStore.flameSensorStatus}</span>
            {getFlameSensorBadge(systemStore.flameSensorStatus)}
          </p>
          <p className="d-flex align-items-baseline gap-1">
            <strong className="text-nowrap">Software interlock:</strong>
            <span className="flex-grow-1 fw-light">
              {laserStore.interlock === undefined ? 'Unknown' : (laserStore.interlock ? 'Enabled' : 'Disabled')}
            </span>
            {getInterlockBadge(laserStore.interlock)}
          </p>
          <p className="d-flex align-items-baseline gap-1">
            <strong className="text-nowrap">UART#1 Status:</strong>
            <span className="flex-grow-1 fw-light">{systemStore.uartStatus}</span>
            {getUartStatusBadge(systemStore.uartStatus)}
          </p>
          <p className="d-flex align-items-baseline gap-1">
            <strong className="text-nowrap">UART#2 Status:</strong>
            <span className="flex-grow-1 fw-light">{(serialStore.connectionState === UartStatus.Error && serialStore.error) ? serialStore.error : serialStore.connectionState}</span>
            {getSerialConnectionBadge(serialStore.connectionState)}
          </p>
        </Card.Body>
      </Card>
    </div>
  );
});

export default Status;

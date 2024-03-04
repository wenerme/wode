import React from 'react';
import styled from 'styled-components';

// loader from https://codepen.io/AlexWarnes/pen/jXYYKL

const SpinnerBox = styled.div`
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
`;

const GradientSpinnerBox = styled(SpinnerBox)`
  .circle-border {
    width: 150px;
    height: 150px;
    padding: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: rgb(63, 249, 220);
    background: linear-gradient(0deg, rgba(63, 249, 220, 0.1) 33%, rgba(63, 249, 220, 1) 100%);
    animation: spin 0.8s linear 0s infinite;
  }

  .circle-core {
    width: 100%;
    height: 100%;
    background-color: #37474f;
    border-radius: 50%;
  }

  @keyframes spin {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(359deg);
    }
  }
`;

const PulseBubbleBox = styled(SpinnerBox)`
  .pulse-container {
    width: 120px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pulse-bubble {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #3ff9dc;
  }

  .pulse-bubble-1 {
    animation: pulse 0.4s ease 0s infinite alternate;
  }
  .pulse-bubble-2 {
    animation: pulse 0.4s ease 0.2s infinite alternate;
  }
  .pulse-bubble-3 {
    animation: pulse 0.4s ease 0.4s infinite alternate;
  }
  @keyframes pulse {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0.25;
      transform: scale(0.75);
    }
  }
`;

export const GradientSpinner: React.FC = () => {
  return (
    <GradientSpinnerBox>
      <div className='circle-border'>
        <div className='circle-core' />
      </div>
    </GradientSpinnerBox>
  );
};

export const PulseBubble: React.FC = () => {
  return (
    <PulseBubbleBox>
      <div className='pulse-container'>
        <div className='pulse-bubble pulse-bubble-1' />
        <div className='pulse-bubble pulse-bubble-2' />
        <div className='pulse-bubble pulse-bubble-3' />
      </div>
    </PulseBubbleBox>
  );
};

const SolarSystemBox = styled(SpinnerBox)`
  .solar-system {
    width: 250px;
    height: 250px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .orbit {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #ffffffa5;
    border-radius: 50%;
  }

  .earth-orbit {
    width: 165px;
    height: 165px;
    animation: spin 12s linear 0s infinite;
  }

  .venus-orbit {
    width: 120px;
    height: 120px;
    animation: spin 7.4s linear 0s infinite;
  }

  .mercury-orbit {
    width: 90px;
    height: 90px;
    animation: spin 3s linear 0s infinite;
  }

  .planet {
    position: absolute;
    top: -5px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #3ff9dc;
  }

  .sun {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background-color: #ffab91;
  }
`;

export const SolarSystemSpinner: React.FC = () => {
  return (
    <SolarSystemBox>
      <div className='solar-system'>
        <div className='earth-orbit orbit'>
          <div className='planet earth' />
          <div className='venus-orbit orbit'>
            <div className='planet venus' />
            <div className='mercury-orbit orbit'>
              <div className='planet mercury' />
              <div className='sun' />
            </div>
          </div>
        </div>
      </div>
    </SolarSystemBox>
  );
};

const PlanetRotatingBox = styled(SpinnerBox)`
  .leo {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
  }

  .blue-orbit {
    width: 165px;
    height: 165px;
    border: 1px solid #91daffa5;
    -webkit-animation: spin3D 3s linear 0.2s infinite;
  }

  .green-orbit {
    width: 120px;
    height: 120px;
    border: 1px solid #91ffbfa5;
    -webkit-animation: spin3D 2s linear 0s infinite;
  }

  .red-orbit {
    width: 90px;
    height: 90px;
    border: 1px solid #ffca91a5;
    -webkit-animation: spin3D 1s linear 0s infinite;
  }

  .white-orbit {
    width: 60px;
    height: 60px;
    border: 2px solid #ffffff;
    -webkit-animation: spin3D 10s linear 0s infinite;
  }

  .w1 {
    transform: rotate3D(1, 1, 1, 90deg);
  }

  .w2 {
    transform: rotate3D(1, 2, 0.5, 90deg);
  }

  .w3 {
    transform: rotate3D(0.5, 1, 2, 90deg);
  }

  @keyframes spin {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(359deg);
    }
  }

  @keyframes spin3D {
    from {
      transform: rotate3d(0.5, 0.5, 0.5, 360deg);
    }
    to {
      transform: rotate3d(0deg);
    }
  }
`;

export const PlantRotating: React.FC = () => {
  return (
    <PlanetRotatingBox>
      <div className='blue-orbit leo' />

      <div className='green-orbit leo' />

      <div className='red-orbit leo' />

      <div className='white-orbit w1 leo' />
      <div className='white-orbit w2 leo' />
      <div className='white-orbit w3 leo' />
    </PlanetRotatingBox>
  );
};

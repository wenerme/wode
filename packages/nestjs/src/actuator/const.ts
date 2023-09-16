import process from 'node:process';

export function hideActuatorApi() {
  return !process.env.ACTUATOR_API;
}

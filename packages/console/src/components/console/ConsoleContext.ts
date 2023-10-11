import { ModuleService } from './module/ModuleService';

export class ConsoleContext {
  protected readonly moduleService = new ModuleService(() => {
    throw new Error('ModuleService.loader is not init');
  });

  public getModuleService() {
    return this.moduleService;
  }
}

let _instance: ConsoleContext;

export function getConsoleContext() {
  return (_instance ||= new ConsoleContext());
}

export function setConsoleContext(instance: ConsoleContext) {
  _instance = instance;
}

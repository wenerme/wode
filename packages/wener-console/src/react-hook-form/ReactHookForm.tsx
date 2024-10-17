import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FC,
  type ReactNode,
} from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  type FieldErrors,
  type FieldValues,
  type UseFormProps,
} from 'react-hook-form';
import { Errors, type MaybePromise } from '@wener/utils';
import { DevOnly } from '../components/DevOnly';
import { FunctionButton } from '../components/FunctionButton';
import { showErrorToast } from '../toast';
import { cn } from '../tw';
import { getDirtyFields } from './getDirtyFields';
import { getFieldErrors } from './getFieldErrors';

type ReactHookFormProviderProps<TFieldValues extends FieldValues = FieldValues, TContext = any> = {
  children?: ReactNode;
  onSubmit?: (data: TFieldValues) => MaybePromise<any>;
} & UseFormProps<TFieldValues, TContext>;

const Context = createContext<ContextState | undefined>(undefined);

type ContextState = {
  id: string;
  // controller: UseFormReturn;
  onValid: (data: any) => void;
  onInvalid?: (errors: FieldErrors) => void;
};

export namespace ReactHookForm {
  export let handleInvalid = _handleInvalid;
  export const Root: FC<ReactHookFormProviderProps> = (props) => {
    return null;
  };

  export function Provider<T extends FieldValues>({ children, onSubmit, ...props }: ReactHookFormProviderProps<T>) {
    const id = useId();
    const controller = useForm({
      mode: 'onBlur',
      ...props,
    });
    const ref = useRef<Partial<ContextState>>({});
    ref.current.onValid = onSubmit;
    const [ctx] = useState<ContextState>(() => {
      return {
        id,
        onValid: (data) => {
          ref.current.onValid?.(data);
        },
        onInvalid: (errors) => {
          (ref.current.onInvalid || handleInvalid)(errors);
        },
      };
    });
    return (
      <FormProvider {...controller}>
        <Context.Provider value={ctx}>{children}</Context.Provider>
      </FormProvider>
    );
  }

  export const Form: FC<ComponentPropsWithoutRef<'form'> & { asChild?: boolean }> = ({
    asChild,
    children,
    ...props
  }) => {
    const { handleSubmit } = useFormContext();
    const { onValid, onInvalid } = Errors.BadRequest.require(useContext(Context), 'ReactHookForm: context not exists');
    return (
      <form
        {...props}
        onSubmit={handleSubmit(onValid, onInvalid || _handleInvalid)}
        autoComplete={'off'}
        aria-autocomplete='none'
      >
        {children}
      </form>
    );
  };

  export const SubmitButton: FC<
    FunctionButton.SubmitButtonProps & {
      dirty?: boolean;
    }
  > = ({ className, dirty = true, children, ...props }) => {
    const { formState } = useFormContext();
    const { isSubmitting, isDirty, disabled } = formState;
    let invalid = disabled || isSubmitting;

    if (dirty) {
      invalid = invalid || !isDirty; // require dirty
    }

    return (
      <FunctionButton.Submit
        className={cn('btn-primary', className)}
        disabled={invalid}
        loading={isSubmitting}
        {...props}
      >
        {children}
      </FunctionButton.Submit>
    );
  };

  const _DebugButton = (props: FunctionButton.ButtonProps) => {
    const { log } = useFormDebug();
    return (
      <FunctionButton.Button onClick={log} {...props}>
        DEBUG
      </FunctionButton.Button>
    );
  };

  export const DebugButton: FC<FunctionButton.ButtonProps> = (props) => {
    return (
      <DevOnly>
        <_DebugButton {...props} />
      </DevOnly>
    );
  };
}

function _handleInvalid(errors: FieldErrors) {
  console.error(`[FormInvalid]`, errors);
  const msg = getFieldErrors(errors)
    .map((v) => `${v.path}: ${v.error.message}`)
    .join('; ');
  showErrorToast(`表单验证失败: ${msg}`);
}

function useFormDebug() {
  const context = useFormContext();
  const { formState, getValues, control } = context;
  return {
    log: () => {
      const {
        defaultValues,
        // name,
        dirtyFields,
        disabled,
        errors,
        isDirty,
        isLoading,
        isSubmitSuccessful,
        isSubmitted,
        isSubmitting,
        isValid,
        isValidating,
        submitCount,
        touchedFields,
        validatingFields,
      } = formState;
      console.log(
        `[FormDebug]`,
        'dirty',
        getDirtyFields(context),
        'value',
        getValues(),
        'formState',
        {
          defaultValues,
          dirtyFields,
          disabled,
          errors,
          isDirty,
          isLoading,
          isSubmitSuccessful,
          isSubmitted,
          isSubmitting,
          isValid,
          isValidating,
          submitCount,
          touchedFields,
          validatingFields,
        },
        'props',
        control._options,
      );
    },
  };
}

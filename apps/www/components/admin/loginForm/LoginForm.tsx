import { User24 } from '@carbon/icons-react';
import {
  Button,
  Grid,
  InlineNotification,
  Loading,
  TextInput,
  ToastNotification,
} from 'carbon-components-react';
import React, { useCallback } from 'react';
import { Field } from 'react-final-form';
import { useMutation } from 'react-query';
import * as Yup from 'yup';

import { getErrorProps, ToWForm } from '../../../utils/formUtils';

import styles from './LoginForm.module.scss';
import { login } from './loginFormUtils';

const loginSchema = Yup.object({
  email: Yup.string().email().required(),
  password: Yup.string().required(),
}).required();
export type LoginType = Yup.InferType<typeof loginSchema>;

export const LoginForm = () => {
  const [mutate, { isLoading, isSuccess, isError }] = useMutation(login);

  const handleSubmit = useCallback(
    async (values: LoginType) => {
      mutate(values);
    },
    [mutate],
  );

  return (
    <ToWForm className={styles.form} onSubmit={handleSubmit} schema={loginSchema}>
      <Grid>
        <h2 className={styles.title}>Zaloguj się</h2>
        <Field name="email">
          {({ input, meta }) => (
            <TextInput
              {...input}
              {...getErrorProps(meta)}
              id="email"
              invalidText="Wpisz poprawny adres email"
              labelText="Adres email"
              placeholder="Wpisz nazwę użytkownika"
            />
          )}
        </Field>
        <Field name="password">
          {({ input, meta }) => (
            <TextInput.PasswordInput
              {...input}
              {...getErrorProps(meta)}
              hidePasswordLabel="Hide password"
              id="password"
              invalidText="Pole jest wymagane"
              labelText="Hasło"
              placeholder="Podaj hasło użytkownika"
              showPasswordLabel="Pokaż hasło"
            />
          )}
        </Field>
        <Button kind="primary" type="submit" renderIcon={User24}>
          Zaloguj się
        </Button>
        {isLoading && <Loading />}
        {isSuccess && (
          <ToastNotification
            kind="success"
            title="Logowanie udane"
            caption=""
            className={styles.toast}
          />
        )}
        {isError && <InlineNotification kind="error" title="Wprowadzone dane nie są poprawne" />}
      </Grid>
    </ToWForm>
  );
};
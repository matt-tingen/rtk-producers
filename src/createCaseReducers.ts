import type { CaseReducer, Draft, PayloadAction } from '@reduxjs/toolkit';
import produce from 'immer';

const mapValues = <T, V>(
  object: T,
  iteree: (value: T[keyof T], key: keyof T) => V,
) => {
  const mapped = Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key,
      iteree(value, key as keyof T),
    ]),
  );

  return mapped as { [K in keyof T]: V };
};

type ProducersFactory<S, K extends string> = (
  state: Draft<S>,
) => Record<K, (...args: never[]) => S | void>;

type ProducedCaseReducer<Args extends unknown[], S> = {
  reducer: CaseReducer<S, PayloadAction<Args>>;
  prepare: (...args: Args) => { payload: Args };
};

type ProducedCaseReducers<
  S,
  K extends string,
  F extends ProducersFactory<S, K>,
> = {
  [Key in keyof ReturnType<F>]: ProducedCaseReducer<
    Parameters<ReturnType<F>[Key]>,
    S
  >;
};

const createCaseReducer = <
  S,
  K extends string,
  F extends ProducersFactory<S, K>,
  P extends K,
>(
  producerName: P,
  producersFactory: F,
): ProducedCaseReducer<Parameters<ReturnType<F>[P]>, S> => ({
  prepare: (...args: Parameters<ReturnType<F>[P]>) => ({ payload: args }),
  /* eslint-disable no-param-reassign */
  reducer: (
    state: Draft<S>,
    { payload }: PayloadAction<Parameters<ReturnType<F>[P]>>,
  ): S | void => {
    // Explanation of necessity of cast:
    // https://github.com/microsoft/TypeScript/issues/39378#issuecomment-653814948
    const producer = producersFactory(state)[producerName] as (
      ...args: unknown[]
    ) => S | void;

    const result = producer(...payload);

    if (typeof result !== 'undefined') return result;
  },
  /* eslint-enable */
});

export const createCaseReducers = <
  S,
  K extends string,
  F extends ProducersFactory<S, K>,
>(
  producersFactory: F,
  initialState: S,
): ProducedCaseReducers<S, K, F> => {
  let producers: ReturnType<F>;
  produce(initialState, (state) => {
    producers = producersFactory(state) as ReturnType<F>;
  });

  return mapValues(producers!, (producer, name) =>
    createCaseReducer<S, K, F, K>(name as K, producersFactory),
  ) as unknown as ProducedCaseReducers<S, K, F>;
};

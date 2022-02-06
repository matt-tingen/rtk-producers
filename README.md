`createCaseReducers` is a helper to reduce the overhead in defining case reducers for `@reduxjs/toolkit` slices, particularly when there is code shared between case reducers.

Example usage:

```ts
interface FooState {
  values: number[];
  selectedIndex?: number;
}

const initialState: FooState = { values: [] };

const buildProducers = (state: FooState) => {
  const deselect = () => {
    state.selectedIndex = undefined;
  };

  const select = (index: number) => {
    state.selectedIndex = index;
  };

  const appendValue = (value: number) => {
    state.values.push(value);
    select(state.values.length - 1);
  };

  return {
    deselect,
    select,
    appendValue,
  };
};

const fooSlice = createSlice({
  name: 'foo',
  initialState,
  reducers: createCaseReducers(buildProducers, initialState),
});
```

The producers factory is called each time an action is dispatched which could potentially have a performance impact if actions are dispatched rapidly. This has not been thoroughly tested.

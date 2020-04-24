import React, { useState, useEffect, useReducer } from 'react';
import { Switch, Route, Link, useRouteMatch } from 'react-router-dom';
import { Payee } from '../common/banking-types';
import dao from './payees-dao';
import PayeesContext, {
  PayeesContextType,
  PayeesContextStateType,
  PayeeAction,
  SortDirection,
} from './payees-context';
import PayeesSearch from './PayeesSearch';
import PayeesList from './PayeesListContext';
import PayeesForm from './PayeesForm';

/*
Routed-to components always have access to 
- history
- location
- match
*/

function payeesReducer(
  state: PayeesContextStateType,
  action: PayeeAction,
): PayeesContextStateType {
  switch (action.type) {
    case 'sort': {
      let sortDirection: SortDirection = 'asc';
      if (state.sortField === action.sortField && state.sortDirection === 'asc') {
        sortDirection = 'desc';
      }
      state.columns.forEach((column) => {
        if (column.field === action.sortField) {
          column.sortIndicator = sortDirection === 'asc' ? '⏫' : '⏬';
        } else {
          column.sortIndicator = '';
        }
      });
      return { ...state, sortField: action.sortField, sortDirection };
    }
    case 'payees': {
      return { ...state, payees: action.payees };
    }
    default:
      throw new Error('Could not understand type: ' + action.type);
  }
}

function PayeesManager() {
  const match = useRouteMatch();
  const parentUrl = match.url;

  // http://esri.com/some/dir/app/ourApp/payees/search
  // http://esri.com/some/dir/app/ourApp  <>     /payees/search

  // index.html
  // <base href="/some/dir/app/ourApp">
  // or
  // App.tsx
  // <Route basename="/some/dir/app/ourApp"> ... </Router>
  // match.url = /payees

  const [promisePayees, setPromisePayees] = useState<Payee[]>([]);
  const [asyncPayees, setAsyncPayees] = useState<Payee[]>([]);

  const initialState: PayeesContextStateType = {
    payees: promisePayees,
    sortField: '',
    sortDirection: 'asc',
    columns: [
      {
        field: 'payeeName',
        label: 'Payee Name',
        sortIndicator: '',
      },
      {
        field: 'address.city',
        label: 'City',
        sortIndicator: '',
      },
      {
        field: 'address.state',
        label: 'State',
        sortIndicator: '',
      },
    ],
  };

  const [state, dispatch] = useReducer(payeesReducer, initialState);

  const contextValue: PayeesContextType = {
    state,
    dispatch,
  };

  useEffect(() => {
    dao.getPayees().then((payees) => {
      setPromisePayees(payees);
      dispatch({ type: 'payees', payees });
    });
  }, []);

  useEffect(() => {
    async function fetchData() {
      const payees = await dao.getPayeesAsync();
      setAsyncPayees(payees);
    }

    fetchData();
  }, []);

  return (
    <PayeesContext.Provider value={contextValue}>
      <div className="row">
        <div className="col">
          <p>With promises: There are {promisePayees?.length} payees.</p>
          <p>Async/await: There are {asyncPayees.length} payees.</p>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <h3>Payees Manager</h3>
          <nav>
            <ul className="list-inline">
              <li className="list-inline-item">
                <Link to={`${parentUrl}/search`}>Search</Link>
              </li>
              <li className="list-inline-item">
                <Link to={`${parentUrl}/browse`}>Browse</Link>
              </li>
              <li className="list-inline-item">
                <Link to={`${parentUrl}/add`}>Add a Payee</Link>
              </li>
              {/*
              <li className="list-inline-item">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => history.push(`${parentUrl}/search`)}
                >
                  Search
                </button>
              </li>
              */}
            </ul>
          </nav>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <Switch>
            <Route path={`${parentUrl}/search`}>
              <PayeesSearch />
            </Route>
            <Route path={`${parentUrl}/browse`}>
              <PayeesList />
            </Route>
            <Route path={`${parentUrl}/add`}>
              <PayeesForm />
            </Route>
          </Switch>
        </div>
      </div>
    </PayeesContext.Provider>
  );
}

export default PayeesManager;

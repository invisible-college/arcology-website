assert = require('assert')
const { createTxObj } = require('./ledger-tx')
const { List, OrderedMap } = require('immutable')

// A standard Transaction from a CSV file
// All bank-specific handling should be in the helper function that calls thie constructor
// date is the clearing date of a transaction as a JS Date
//   (we don't currently support a separate posting date)
// payeeLong
// amount - a positive number represented as a String
// type - a String which is one of { 'credit', 'debit' }
// account is the ledger-style base account as a colon-delimited string
class TransactionFromCSV {

  constructor(params) {
    this.date = params['date']
    this.payeeLong = params['payeeLong']
    this.amount = params['amount'] 
    this.type = params['type']
    assert.ok(this.type === 'debit' || this.type === 'credit')
    this.fromAccount = params['fromAccount']
    this.toAccount = params['toAccount']
    const predictedAccount = predictAccount(params)
    this.fromAccount = (this.type === 'credit') ? predictedAccount : BASE_ACCOUNT
    this.toAccount = (this.type === 'debit') ? predictedAccount : BASE_ACCOUNT
  }

  toEquityTxObj() {
    return createTxObj({
      txDate: this.date.toLocaleString(),
      amountNumber: this.amount,
      amountCurrency: CURRENCY,
      payee: this.payeeLong,
      description: this.description,
      fromAccount: (type === 'debit') ? BASE_ACCOUNT : this.account,
      toAccount: (type === 'credit') ? BASE_ACCOUNT : this.account,
    })
  }

  // Old ledger-cli, in case we ever have to use it in the future
  toLedgerString() {
    let year = this.date.getUTCFullYear()
    let month = this.date.getUTCMonth()+1 // 0 based
    let day = this.date.getUTCDay()+1 // 0 based
    return `${year}/${month}/${day} ${this.payeeLong}
        ${this.toAccount}        ${this.amount} ${CURRENCY}
        ${this.fromAccount} 
    `
  }
}

ACCOUNT_CRITERIA = new List([
  ['Arcology:Income:Airbnb',
    new OrderedMap({ // we actually don't need this to be ordered, just reducible
      'payeeLong': /AIRBNB/,
      'type'     : 'credit',
    })
  ],
  ['Arcology:Expenses:Phone',
    new OrderedMap({
      'payeeLong': /SIMPLEMOBILE/,
      'type'     : 'debit',
    })
  ],
  ['Arcology:Expenses:Groceries',
    new OrderedMap({
      'payeeLong': /KEY FOOD/,
      'type'     : 'debit',
    })
  ],
  ['Arcology:Expenses:Groceries',
    new OrderedMap({
      'payeeLong': /FOOD BAZA/,
      'type'     : 'debit',
    })
  ],
  ['Arcology:Expenses:Electricity',
    new OrderedMap({
      'payeeLong': /CON ED/,
      'type'     : 'debit',
    })
  ],
  ['Arcology:Expenses:Supplies',
     new OrderedMap({
      'payeeLong': /NEW DOLLAR/,
      'type'     : 'debit',
     })
  ],
  ['Arcology:Expenses:Supplies',
     new OrderedMap({
      'payeeLong': /DALAL 99/,
      'type'     : 'debit',
     })
  ],
  ['Arcology:Expenses:Rent',
     new OrderedMap({
      'payeeLong': /Check/,
      'type'     : 'debit',
     })
  ],
  ['Arcology:Expenses:Fees',
     new OrderedMap({
      'payeeLong': /Check/,
      'amount'     : '2',
     })
  ],
])

// We predict the given source/destination acct based only on standard params
// given to constructor of TransactionFromCSV
function predictAccount(ctorParams) {
  // Find the first (highest-priority) entry that matches to predict the account
  // for this transaction
  const found = ACCOUNT_CRITERIA.find(
    (criteria) => {
      return criteria[1].reduce((sum, val, key) => {
        return (sum && ctorParams[key].match(val))
      }, true)
    })
  return (found) ? found[0] : "Imbalance"
}

function line2tx(line) {
  tokens = line.split(",")
  date = new Date(tokens[0])
  payeeShort = tokens[1]
  payeeLong = tokens[2]
  amount = tokens[3]
  type = tokens[4]
  category = tokens[5] 
  account = tokens[6]
  return new Transaction(new Date(date), payeeShort, payeeLong, amount, type, category, account)
}

//becuLines(lines)
/*
 * Copyright 2016-2016 Imply Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



import { r, ExpressionJS, ExpressionValue, Expression, ChainableUnaryExpression } from './baseExpression';
import { SQLDialect } from '../dialect/baseDialect';
import { PlywoodValue } from '../datatypes/index';

export class IndexOfExpression extends ChainableUnaryExpression {
  static op = "IndexOf";
  static fromJS(parameters: ExpressionJS): IndexOfExpression {
    return new IndexOfExpression(ChainableUnaryExpression.jsToValue(parameters));
  }

  constructor(parameters: ExpressionValue) {
    super(parameters, dummyObject);
    this._ensureOp("indexOf");
    this._checkOperandTypes('STRING');
    this._checkExpressionTypes('STRING');
    this.type = 'NUMBER';
  }

  protected _calcChainableUnaryHelper(operandValue: any, expressionValue: any): PlywoodValue {
    return operandValue ? (operandValue as string).indexOf(expressionValue) : null;
  }

  protected _getJSChainableUnaryHelper(operandJS: string, expressionJS: string): string {
    return Expression.jsNullSafetyBinary(operandJS, expressionJS, ((a, b) => `${a}.indexOf(${b})`), operandJS[0] === '"', expressionJS[0] === '"');
  }

  protected _getSQLChainableUnaryHelper(dialect: SQLDialect, operandSQL: string, expressionSQL: string): string {
    return dialect.indexOfExpression(operandSQL, expressionSQL);
  }
}

Expression.register(IndexOfExpression);
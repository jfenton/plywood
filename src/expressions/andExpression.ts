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


import { r, ExpressionJS, ExpressionValue, Expression, ChainableUnaryExpression, ExpressionMatchFn, ExtractAndRest } from './baseExpression';
import { SQLDialect } from '../dialect/baseDialect';
import { PlywoodValue } from '../datatypes/index';
import { Set } from '../datatypes/set';

const IS_OR_IN: Lookup<boolean> = {
  'is': true,
  'in': true
};

export class AndExpression extends ChainableUnaryExpression {
  static op = "And";
  static fromJS(parameters: ExpressionJS): AndExpression {
    return new AndExpression(ChainableUnaryExpression.jsToValue(parameters));
  }

  static merge(ex1: Expression, ex2: Expression): Expression | null {
    if (ex1.equals(ex2)) return ex1;

    if (!IS_OR_IN[ex1.op] || !IS_OR_IN[ex2.op]) return null;
    const { operand: lhs1, expression: rhs1 } = ex1 as ChainableUnaryExpression;
    const { operand: lhs2, expression: rhs2 } = ex2 as ChainableUnaryExpression;

    if (!lhs1.equals(lhs2) || !rhs1.isOp('literal') || !rhs2.isOp('literal')) return null;

    let intersect = Set.generalIntersect(rhs1.getLiteralValue(), rhs2.getLiteralValue());
    if (intersect === null) return null;

    return Expression.inOrIs(lhs1, intersect);
  }

  constructor(parameters: ExpressionValue) {
    super(parameters, dummyObject);
    this._ensureOp("and");
    this._checkOperandTypes('BOOLEAN');
    this._checkExpressionTypes('BOOLEAN');
    this.type = 'BOOLEAN';
  }

  protected _calcChainableUnaryHelper(operandValue: any, expressionValue: any): PlywoodValue {
    return operandValue && expressionValue;
  }

  protected _getJSChainableUnaryHelper(operandJS: string, expressionJS: string): string {
    return `(${operandJS}&&${expressionJS})`;
  }

  protected _getSQLChainableUnaryHelper(dialect: SQLDialect, operandSQL: string, expressionSQL: string): string {
    return `(${operandSQL} AND ${expressionSQL})`;
  }

  public isCommutative(): boolean {
    return true;
  }

  public isAssociative(): boolean {
    return true;
  }

  protected specialSimplify(): Expression {
    const { operand, expression } = this;
    if (expression.equals(Expression.FALSE)) return Expression.FALSE;
    if (expression.equals(Expression.TRUE)) return operand;

    if (operand instanceof AndExpression) {
      let andExpressions = operand.getExpressionList();
      for (let i = 0; i < andExpressions.length; i++) {
        let andExpression = andExpressions[i];
        let mergedExpression = AndExpression.merge(andExpression, expression);
        if (mergedExpression) {
          andExpressions[i] = mergedExpression;
          return Expression.and(andExpressions).simplify();
        }
      }
    } else {
      let mergedExpression = AndExpression.merge(operand, expression);
      if (mergedExpression) return mergedExpression;
    }

    return this;
  }

  public extractFromAnd(matchFn: ExpressionMatchFn): ExtractAndRest {
    if (!this.simple) return this.simplify().extractFromAnd(matchFn);

    const andExpressions = this.getExpressionList();

    let includedExpressions: Expression[] = [];
    let excludedExpressions: Expression[] = [];
    for (let ex of andExpressions) {
      if (matchFn(ex)) {
        includedExpressions.push(ex);
      } else {
        excludedExpressions.push(ex);
      }
    }

    return {
      extract: Expression.and(includedExpressions),
      rest: Expression.and(excludedExpressions)
    };
  }
}

Expression.register(AndExpression);

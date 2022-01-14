import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EMPTY, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list-alt.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListAltComponent {
  pageTitle = 'Products';
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  products$ = this.productService.productsWithCategories$
    .pipe(catchError(error => {
      this.errorMessageSubject.next(error);
      return EMPTY;
    }));

  selectedProducts$ = this.productService.selectedProduct$
    .pipe(catchError(error => {
      this.errorMessageSubject.next(error);
      return EMPTY;
    }));

  constructor(private productService: ProductService) {}

  onSelected(productId: number): void {
    this.productService.selectedProductChange(+productId);
  }
}

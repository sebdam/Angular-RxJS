import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BehaviorSubject, combineLatest, EMPTY, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';

import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  pageTitle = 'Product List';
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  private categorySelectedSubject = new BehaviorSubject<number>(0);
  categorySelectedAction$ = this.categorySelectedSubject.asObservable();
  categories$ = this.productCatgoryService.productCategories$
  .pipe(
    catchError(error => {
      this.errorMessageSubject.next(error);
      return EMPTY;
    })
  );

  products$ = this.productService.productsWithAdd$
    .pipe(
      catchError(error => {
        this.errorMessageSubject.next(error);
        return EMPTY;
      })
    );

  productsFiltered$ = combineLatest([this.products$, this.categorySelectedAction$])
    .pipe(
      map(([products, categorySelected]) =>
        products.filter(p => categorySelected ? p.categoryId === categorySelected : true)));

  constructor(private productService: ProductService,
    private productCatgoryService : ProductCategoryService) { }

  onAdd(): void {
    this.productService.addProduct();
  }

  onSelected(categoryId: string): void {
    this.categorySelectedSubject.next(+categoryId);
  }
}

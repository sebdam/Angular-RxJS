import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, combineLatest, from, merge, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, mergeMap, scan, shareReplay, tap, toArray } from 'rxjs/operators';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';
import { SupplierService } from '../suppliers/supplier.service';
import { ProductCategoryService } from '../product-categories/product-category.service'

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = this.supplierService.suppliersUrl;

  products$ = this.http.get<Product[]>(this.productsUrl)
    .pipe(
      tap(data => console.log('Products in service: ', data)),
      catchError(this.handleError)
    );

  productsWithCategories$ = combineLatest([
    this.products$,
    this.productCategoryService.productCategories$
  ]).pipe(
    map(([products, categories]) =>
      products.map(product=>{
        product.price *= 1.5;
        product.searchKey = [product.productName];
        product.category = categories.find(c=>c.id === product.categoryId).name;
        return product;
      })
    ),
    shareReplay(1)
  );

  private selectedProductSubject = new BehaviorSubject<number>(0);
  selectedProductAction$ = this.selectedProductSubject.asObservable();
  selectedProduct$ = combineLatest([this.productsWithCategories$, this.selectedProductAction$])
  .pipe(
    map(([products, productSelected]) =>
      products.find(p => productSelected ? p.id === productSelected : true)));

  private productInsertedSubject = new Subject<Product>();
  productInsertedAction$ = this.productInsertedSubject.asObservable();

  productsWithAdd$ = merge(this.productsWithCategories$,this.productInsertedAction$)
    .pipe(
      scan((acc:Product[], value:Product) => [...acc, value] )
    );

  selectedProductSupplier$ = this.selectedProduct$
      .pipe(
        mergeMap(selectedProduct =>
          from(selectedProduct.supplierIds)
            .pipe(
              mergeMap(supplierId => this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)),
              toArray()
            )
          )
      );

  constructor(private http: HttpClient,
              private productCategoryService: ProductCategoryService,
              private supplierService: SupplierService) {}

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      category: 'Toolbox',
      quantityInStock: 30
    };
  }

  private handleError(err: any): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }

  selectedProductChange(id: number){
    this.selectedProductSubject.next(id);
  }

  addProduct(newProduct?: Product){
    newProduct = newProduct || this.fakeProduct();
    this.productInsertedSubject.next(newProduct);
  }
}

